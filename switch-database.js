import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Определяем текущую директорию
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

// Функция для проверки, установлен ли Docker
async function isDockerInstalled() {
  return new Promise((resolve) => {
    const docker = spawn('docker', ['--version']);
    
    docker.on('close', (code) => {
      resolve(code === 0);
    });
    
    docker.on('error', () => {
      resolve(false);
    });
  });
}

// Функция для проверки, работает ли MySQL контейнер
async function isMySQLContainerRunning() {
  return new Promise((resolve) => {
    const dockerPs = spawn('docker', ['ps', '--filter', 'name=game-catalog-mysql', '--format', '{{.Names}}']);
    let output = '';
    
    dockerPs.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    dockerPs.on('close', (code) => {
      resolve(code === 0 && output.includes('game-catalog-mysql'));
    });
    
    dockerPs.on('error', () => {
      resolve(false);
    });
  });
}

// Функция для запуска MySQL контейнера
async function startMySQLContainer() {
  return new Promise((resolve) => {
    console.log('Запускаем MySQL контейнер...');
    
    const dockerCompose = spawn('docker-compose', ['up', '-d']);
    
    dockerCompose.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    dockerCompose.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    dockerCompose.on('close', (code) => {
      resolve(code === 0);
    });
    
    dockerCompose.on('error', (err) => {
      console.error('Ошибка при запуске Docker:', err);
      resolve(false);
    });
  });
}

// Функция для изменения .env файла
function updateEnvFile(dbType) {
  try {
    // Читаем текущий .env файл
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Заменяем DB_TYPE
    envContent = envContent.replace(
      /DB_TYPE=(mysql|sqlite)/,
      `DB_TYPE=${dbType}`
    );
    
    // Записываем обновленный .env файл
    fs.writeFileSync(envPath, envContent);
    
    return true;
  } catch (error) {
    console.error('Ошибка при обновлении .env файла:', error);
    return false;
  }
}

// Основная функция
async function switchDatabase() {
  // Получаем аргумент командной строки
  const args = process.argv.slice(2);
  let targetDb = args[0]?.toLowerCase();
  
  // Если аргумент не указан или неверный, спрашиваем пользователя
  if (targetDb !== 'mysql' && targetDb !== 'sqlite') {
    console.log('Использование: node switch-database.js [mysql|sqlite]');
    console.log('Выберите базу данных:');
    console.log('1. SQLite (локальная файловая БД, проще в использовании)');
    console.log('2. MySQL (более производительная, но требует установки)');
    
    // Здесь бы использовали readline для ввода пользователя,
    // но для простоты просто выведем инструкцию
    console.log('\nУкажите тип базы данных в команде:');
    console.log('node switch-database.js sqlite');
    console.log('или');
    console.log('node switch-database.js mysql');
    return;
  }
  
  // Текущий тип базы данных
  let currentDbType;
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DB_TYPE=(mysql|sqlite)/);
    currentDbType = match ? match[1] : 'sqlite';
  } catch (error) {
    console.error('Ошибка при чтении .env файла:', error);
    currentDbType = 'sqlite';
  }
  
  // Если текущий тип совпадает с целевым, выводим сообщение
  if (currentDbType === targetDb) {
    console.log(`Приложение уже настроено на использование ${targetDb.toUpperCase()}`);
    return;
  }
  
  // Переключаемся на MySQL
  if (targetDb === 'mysql') {
    // Проверяем, установлен ли Docker
    const dockerInstalled = await isDockerInstalled();
    if (!dockerInstalled) {
      console.error('Docker не установлен или не доступен в текущем окружении.');
      console.error('Для использования MySQL необходимо установить Docker:');
      console.error('https://www.docker.com/products/docker-desktop/');
      return;
    }
    
    // Проверяем, запущен ли MySQL контейнер
    const mysqlRunning = await isMySQLContainerRunning();
    if (!mysqlRunning) {
      console.log('MySQL контейнер не запущен.');
      
      // Пытаемся запустить MySQL контейнер
      const started = await startMySQLContainer();
      if (!started) {
        console.error('Не удалось запустить MySQL контейнер.');
        console.error('Попробуйте запустить его вручную:');
        console.error('docker-compose up -d');
        return;
      }
      
      console.log('MySQL контейнер успешно запущен.');
    }
    
    // Запускаем миграцию данных
    console.log('Запускаем миграцию данных из SQLite в MySQL...');
    const migrate = spawn('node', ['migrate-to-mysql.js']);
    
    migrate.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    migrate.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    migrate.on('close', (code) => {
      if (code === 0) {
        // Обновляем .env файл
        if (updateEnvFile('mysql')) {
          console.log('Приложение успешно переключено на MySQL!');
          console.log('Теперь вы можете запустить приложение:');
          console.log('npm start');
        } else {
          console.error('Произошла ошибка при обновлении .env файла.');
        }
      } else {
        console.error('Миграция данных завершилась с ошибкой.');
        console.error('Подробности см. выше.');
      }
    });
  } 
  // Переключаемся на SQLite
  else if (targetDb === 'sqlite') {
    // Просто обновляем .env файл
    if (updateEnvFile('sqlite')) {
      console.log('Приложение успешно переключено на SQLite!');
      console.log('Теперь вы можете запустить приложение:');
      console.log('npm start');
    } else {
      console.error('Произошла ошибка при обновлении .env файла.');
    }
  }
}

// Запускаем основную функцию
switchDatabase(); 