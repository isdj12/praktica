import './poisk.css'    

export default function Poisk() {
    return (
        <div className="search-container">
            <input type="text" placeholder="Поиск" className="poisk" />
            <button type="submit" className="button-poisk" onClick={() => { console.log('все окей'); }}>Поиск</button>
        </div>
    )
}
