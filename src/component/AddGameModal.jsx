import { useState, useEffect, useRef } from 'react';
import '../UserProfile.css';

function AddGameModal({ isOpen = true, onClose, onAddGame, isLoading }) {
  // Предопределенные списки жанров и тегов
  const availableGenres = [
    "Экшен", "Приключения", "RPG", "Стратегия", "Шутер", 
    "Симулятор", "Спорт", "Гонки", "Файтинг", "Хоррор", 
    "Платформер", "Головоломка", "Открытый мир", "Выживание"
  ];
  
  const availableTags = [
    "Однопользовательская", "Мультиплеер", "Кооператив", "Инди", 
    "Песочница", "Атмосферная", "Сюжетная", "Ретро", "Киберпанк", 
    "Фэнтези", "Научная фантастика", "Реализм", "Аниме", "Пиксельная графика", 
    "Процедурная генерация", "Ранний доступ", "Бесплатная", "Экономика"
  ];
  
  const availablePlatforms = [
    "PC", "PlayStation 5", "PlayStation 4", "Xbox Series X/S", "Xbox One", 
    "Nintendo Switch", "iOS", "Android", "Mac", "Linux"
  ];
  
  const availableAgeRatings = [
    "3+", "6+", "12+", "16+", "18+", "Для всех", "E (Everyone)", 
    "T (Teen)", "M (Mature)", "A (Adult)", "PEGI 3", "PEGI 7", 
    "PEGI 12", "PEGI 16", "PEGI 18"
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [],
    platform: '',
    multiplayer: 'Нет',
    ageRating: '',
    releaseDate: '',
    genre: '',
    image: null,
    screenshots: [],
    gameFile: null
  });

  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [screenshotPreviews, setScreenshotPreviews] = useState([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showAgeRatingDropdown, setShowAgeRatingDropdown] = useState(false);
  const [genreSearch, setGenreSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [platformSearch, setPlatformSearch] = useState('');
  const [ageRatingSearch, setAgeRatingSearch] = useState('');
  
  // Refs для выпадающих списков
  const genreDropdownRef = useRef(null);
  const tagsDropdownRef = useRef(null);
  const platformDropdownRef = useRef(null);
  const ageRatingDropdownRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(isLoading || false);
  const [submitError, setSubmitError] = useState(null);

  // Обновляем состояние isSubmitting при изменении пропа isLoading
  useEffect(() => {
    if (isLoading !== undefined) {
      setIsSubmitting(isLoading);
    }
  }, [isLoading]);

  // Обработчик клика вне выпадающих списков
  useEffect(() => {
    function handleClickOutside(event) {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target)) {
        setShowGenreDropdown(false);
      }
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
        setShowTagsDropdown(false);
      }
      if (platformDropdownRef.current && !platformDropdownRef.current.contains(event.target)) {
        setShowPlatformDropdown(false);
      }
      if (ageRatingDropdownRef.current && !ageRatingDropdownRef.current.contains(event.target)) {
        setShowAgeRatingDropdown(false);
      }
    }
    
    // Добавляем обработчик события
    document.addEventListener('mousedown', handleClickOutside);
    
    // Удаляем обработчик при размонтировании компонента
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => {
      // Если тег уже выбран, удаляем его
      if (prev.tags.includes(tag)) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t !== tag)
        };
      }
      // Если не выбран и выбрано меньше 3 тегов, добавляем
      else if (prev.tags.length < 3) {
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
      // Если уже выбрано 3 тега, ничего не делаем
      return prev;
    });
  };

  const handleGenreSelect = (genre) => {
    setFormData(prev => ({
      ...prev,
      genre
    }));
    setShowGenreDropdown(false);
    setGenreSearch('');
  };
  
  const handlePlatformSelect = (platform) => {
    setFormData(prev => ({
      ...prev,
      platform
    }));
    setShowPlatformDropdown(false);
    setPlatformSearch('');
  };
  
  const handleAgeRatingSelect = (ageRating) => {
    setFormData(prev => ({
      ...prev,
      ageRating
    }));
    setShowAgeRatingDropdown(false);
    setAgeRatingSearch('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка размера файла (до 5 МБ)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({...errors, image: 'Размер изображения не должен превышать 5 МБ'});
        e.target.value = '';
        return;
      }
      
      // Проверка типа файла
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({...errors, image: 'Разрешены только форматы: JPG, PNG, WEBP, GIF'});
        e.target.value = '';
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Очистка ошибки, если она была
      if (errors.image) {
        setErrors({...errors, image: undefined});
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshotsChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        // Ограничиваем количество скриншотов до 3
        if (formData.screenshots.length + files.length > 3) {
          alert('Максимальное количество скриншотов - 3');
          e.target.value = '';
          return;
        }

        // Проверка каждого файла
        const validFiles = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Проверка размера файла (до 1 МБ)
          if (file.size > 1 * 1024 * 1024) {
            alert(`Файл ${file.name} слишком большой. Максимальный размер 1 МБ.`);
            continue;
          }
          
          // Проверка типа файла
          const allowedTypes = ['image/jpeg', 'image/png'];
          if (!allowedTypes.includes(file.type)) {
            alert(`Файл ${file.name} имеет неподдерживаемый формат. Разрешены только JPG и PNG.`);
            continue;
          }
          
          validFiles.push(file);
        }
        
        if (validFiles.length === 0) {
          e.target.value = '';
          return;
        }
        
        // Добавляем файлы в состояние
        setFormData(prev => ({
          ...prev,
          screenshots: [...prev.screenshots, ...validFiles]
        }));
        
        // Генерируем превью для каждого файла
        validFiles.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setScreenshotPreviews(prev => [...prev, reader.result]);
          };
          reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error('Ошибка при обработке скриншотов:', error);
        alert('Произошла ошибка при обработке скриншотов. Пожалуйста, попробуйте еще раз с меньшими изображениями.');
      } finally {
        // Очищаем input, чтобы можно было загрузить те же файлы повторно
        e.target.value = '';
      }
    }
  };

  // Обработчик для загрузки файла игры
  const handleGameFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка на ZIP формат
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setErrors({...errors, gameFile: 'Разрешены только ZIP-архивы'});
        e.target.value = '';
        return;
      }
      
      // Проверка размера файла (до 50 МБ)
      if (file.size > 50 * 1024 * 1024) {
        setErrors({...errors, gameFile: 'Размер файла не должен превышать 50 МБ'});
        e.target.value = '';
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        gameFile: file
      }));
      
      // Очистка ошибки, если она была
      if (errors.gameFile) {
        setErrors({...errors, gameFile: undefined});
      }
    }
  };

  const removeScreenshot = (index) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Проверка обязательных полей
    if (!formData.name.trim()) newErrors.name = 'Название игры обязательно';
    else if (formData.name.trim().length > 100) newErrors.name = 'Название игры слишком длинное (максимум 100 символов)';
    
    if (!formData.description.trim()) newErrors.description = 'Описание обязательно';
    else if (formData.description.trim().length > 2000) newErrors.description = 'Описание слишком длинное (максимум 2000 символов)';
    
    if (!formData.platform.trim()) newErrors.platform = 'Платформа обязательна';
    else if (formData.platform.trim().length > 50) newErrors.platform = 'Название платформы слишком длинное';
    
    if (!formData.genre.trim()) newErrors.genre = 'Жанр обязателен';
    else if (formData.genre.trim().length > 50) newErrors.genre = 'Название жанра слишком длинное';
    
    if (!formData.image) newErrors.image = 'Основное изображение обязательно';
    
    // Если выбрана дата выпуска, проверяем её валидность
    if (formData.releaseDate) {
      const releaseDate = new Date(formData.releaseDate);
      const currentDate = new Date();
      const minDate = new Date('1970-01-01');
      
      if (isNaN(releaseDate.getTime())) {
        newErrors.releaseDate = 'Неверный формат даты';
      } else if (releaseDate > currentDate) {
        newErrors.releaseDate = 'Дата не может быть в будущем';
      } else if (releaseDate < minDate) {
        newErrors.releaseDate = 'Дата слишком старая';
      }
    }
    
    // Устанавливаем все ошибки сразу
    setErrors(newErrors);
    
    // Проверяем, есть ли ошибки
    const hasErrors = Object.keys(newErrors).length > 0;
    
    // Если есть ошибки, прокручиваем к первой ошибке
    if (hasErrors) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
    
    return !hasErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError(null); // Сбрасываем ошибку перед отправкой
    
    if (validateForm()) {
      setIsSubmitting(true); // Устанавливаем состояние загрузки
      
      try {
        // Создаем объект FormData для отправки файлов
        const gameData = new FormData();
        
        // Добавляем текстовые поля
        gameData.append('name', formData.name.trim());
        gameData.append('description', formData.description.trim());
        
        // Добавляем теги (максимум 3)
        for (let i = 0; i < Math.min(formData.tags.length, 3); i++) {
          gameData.append(`tag${i+1}`, formData.tags[i]);
        }
        
        gameData.append('platform', formData.platform.trim());
        gameData.append('multiplayer', formData.multiplayer);
        
        if (formData.ageRating) {
          gameData.append('ageRating', formData.ageRating);
        }
        
        if (formData.releaseDate) {
          gameData.append('releaseDate', formData.releaseDate);
        }
        
        gameData.append('genre', formData.genre.trim());
        
        // Добавляем основное изображение
        gameData.append('image', formData.image);
        
        // Добавляем скриншоты (максимум 3)
        if (formData.screenshots && formData.screenshots.length > 0) {
          const maxScreenshots = Math.min(formData.screenshots.length, 3);
          
          for (let i = 0; i < maxScreenshots; i++) {
            const screenshot = formData.screenshots[i];
            if (screenshot instanceof File) {
              // Используем простые имена файлов
              gameData.append('screenshots', screenshot);
            }
          }
        }
        
        // Добавляем файл игры, если он есть
        if (formData.gameFile instanceof File) {
          gameData.append('gameFile', formData.gameFile);
        }
        
        // Вызываем функцию добавления игры
        onAddGame(gameData)
          .then(() => {
            // Успешное добавление игры
            setIsSubmitting(false);
            // Остальная логика обработки успеха уже в родительском компоненте
          })
          .catch(error => {
            console.error('Ошибка при добавлении игры:', error);
            setSubmitError(error.message || 'Произошла ошибка при добавлении игры');
            setIsSubmitting(false);
          });
      } catch (error) {
        console.error('Ошибка при подготовке данных:', error);
        setSubmitError(error.message || 'Произошла ошибка при подготовке данных');
        setIsSubmitting(false);
      }
    }
  };

  // Фильтрация жанров по поисковому запросу
  const filteredGenres = availableGenres.filter(genre => 
    genre.toLowerCase().includes(genreSearch.toLowerCase())
  );

  // Фильтрация тегов по поисковому запросу
  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );
  
  // Фильтрация платформ по поисковому запросу
  const filteredPlatforms = availablePlatforms.filter(platform => 
    platform.toLowerCase().includes(platformSearch.toLowerCase())
  );
  
  // Фильтрация возрастных рейтингов по поисковому запросу
  const filteredAgeRatings = availableAgeRatings.filter(rating => 
    rating.toLowerCase().includes(ageRatingSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="add-game-modal">
        <div className="modal-header">
          <h2>Добавление новой игры</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="add-game-form">
          <div className="form-group">
            <label htmlFor="name">Название игры*:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Описание*:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={errors.description ? 'error' : ''}
            ></textarea>
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group dropdown-container">
              <label htmlFor="genre">Жанр*:</label>
              <div className="custom-dropdown" ref={genreDropdownRef}>
                <input
                  type="text"
                  id="genre"
                  name="genre"
                  value={formData.genre || genreSearch}
                  onChange={(e) => {
                    setGenreSearch(e.target.value);
                    if (!showGenreDropdown) setShowGenreDropdown(true);
                    if (formData.genre) setFormData({...formData, genre: e.target.value});
                  }}
                  onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  className={errors.genre ? 'error' : ''}
                  placeholder="Выберите или введите жанр"
                />
                {errors.genre && <span className="error-message">{errors.genre}</span>}
                
                {showGenreDropdown && (
                  <div className="dropdown-menu">
                    {filteredGenres.length > 0 ? (
                      filteredGenres.map((genre, index) => (
                        <div 
                          key={index} 
                          className="dropdown-item"
                          onClick={() => handleGenreSelect(genre)}
                        >
                          {genre}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item no-results">Нет результатов</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group dropdown-container">
              <label htmlFor="platform">Платформа*:</label>
              <div className="custom-dropdown" ref={platformDropdownRef}>
                <input
                  type="text"
                  id="platform"
                  name="platform"
                  value={formData.platform || platformSearch}
                  onChange={(e) => {
                    setPlatformSearch(e.target.value);
                    if (!showPlatformDropdown) setShowPlatformDropdown(true);
                    if (formData.platform) setFormData({...formData, platform: e.target.value});
                  }}
                  onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                  className={errors.platform ? 'error' : ''}
                  placeholder="Выберите или введите платформу"
                />
                {errors.platform && <span className="error-message">{errors.platform}</span>}
                
                {showPlatformDropdown && (
                  <div className="dropdown-menu">
                    {filteredPlatforms.length > 0 ? (
                      filteredPlatforms.map((platform, index) => (
                        <div 
                          key={index} 
                          className="dropdown-item"
                          onClick={() => handlePlatformSelect(platform)}
                        >
                          {platform}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item no-results">Нет результатов</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-group dropdown-container">
            <label>Теги (до 3):</label>
            <div className="custom-dropdown" ref={tagsDropdownRef}>
              <div 
                className="tags-input"
                onClick={() => setShowTagsDropdown(!showTagsDropdown)}
              >
                {formData.tags.length > 0 ? (
                  <div className="selected-tags">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="selected-tag">
                        {tag}
                        <button 
                          type="button" 
                          className="remove-tag"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagToggle(tag);
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="placeholder-text">Выберите до 3 тегов</span>
                )}
              </div>
              
              {showTagsDropdown && (
                <div className="dropdown-menu tags-dropdown">
                  <div className="dropdown-search">
                    <input
                      type="text"
                      placeholder="Поиск тегов..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="dropdown-items-container">
                    {filteredTags.length > 0 ? (
                      filteredTags.map((tag, index) => (
                        <div 
                          key={index} 
                          className={`dropdown-item tag-item ${formData.tags.includes(tag) ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagToggle(tag);
                          }}
                        >
                          <span className="tag-checkbox">
                            {formData.tags.includes(tag) ? '✓' : ''}
                          </span>
                          {tag}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item no-results">Нет результатов</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="multiplayer">Мультиплеер:</label>
              <select
                id="multiplayer"
                name="multiplayer"
                value={formData.multiplayer}
                onChange={handleChange}
              >
                <option value="Нет">Нет</option>
                <option value="Локальный">Локальный</option>
                <option value="Онлайн">Онлайн</option>
                <option value="Локальный и онлайн">Локальный и онлайн</option>
              </select>
            </div>
            
            <div className="form-group dropdown-container">
              <label htmlFor="ageRating">Возрастной рейтинг:</label>
              <div className="custom-dropdown" ref={ageRatingDropdownRef}>
                <input
                  type="text"
                  id="ageRating"
                  name="ageRating"
                  value={formData.ageRating || ageRatingSearch}
                  onChange={(e) => {
                    setAgeRatingSearch(e.target.value);
                    if (!showAgeRatingDropdown) setShowAgeRatingDropdown(true);
                    if (formData.ageRating) setFormData({...formData, ageRating: e.target.value});
                  }}
                  onClick={() => setShowAgeRatingDropdown(!showAgeRatingDropdown)}
                  placeholder="Выберите или введите рейтинг"
                />
                
                {showAgeRatingDropdown && (
                  <div className="dropdown-menu">
                    {filteredAgeRatings.length > 0 ? (
                      filteredAgeRatings.map((rating, index) => (
                        <div 
                          key={index} 
                          className="dropdown-item"
                          onClick={() => handleAgeRatingSelect(rating)}
                        >
                          {rating}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item no-results">Нет результатов</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="releaseDate">Дата выпуска:</label>
            <input
              type="date"
              id="releaseDate"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="image">Основное изображение*:</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              className={errors.image ? 'error' : ''}
            />
            {errors.image && <span className="error-message">{errors.image}</span>}
            
            {previewImage && (
              <div className="image-preview">
                <img src={previewImage} alt="Превью изображения" />
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="screenshots">Скриншоты игры:</label>
            <input
              type="file"
              id="screenshots"
              name="screenshots"
              accept="image/*"
              multiple
              onChange={handleScreenshotsChange}
            />
            
            {screenshotPreviews.length > 0 && (
              <div className="screenshots-preview">
                {screenshotPreviews.map((preview, index) => (
                  <div key={index} className="screenshot-item">
                    <img src={preview} alt={`Скриншот ${index + 1}`} />
                    <button 
                      type="button" 
                      className="remove-screenshot" 
                      onClick={() => removeScreenshot(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="gameFile">Файл игры:</label>
            <input
              type="file"
              id="gameFile"
              name="gameFile"
              accept=".zip"
              onChange={handleGameFileChange}
              className={errors.gameFile ? 'error' : ''}
            />
            {errors.gameFile && <span className="error-message">{errors.gameFile}</span>}
            <p className="form-helper-text">
              Загрузите ZIP-архив с вашей игрой. Максимальный размер: 50 МБ.
              После добавления игры также можно будет загрузить файл на странице игры.
            </p>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn sm dang" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn sm prim" disabled={isSubmitting}>
              {isSubmitting ? 'Добавление...' : 'Добавить игру'}
            </button>
          </div>
          
          {submitError && (
            <div className="submit-error-message">
              <span className="error-icon">⚠️</span> {submitError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default AddGameModal; 