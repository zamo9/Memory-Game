import react from "react";


export default function Tile({tile, handleClick, flipped, matched}) {
    return (
        <div className={`tile ${flipped || matched ? "flipped" : ""}`} onClick={() => handleClick(tile)}
        
        style={{cursor : flipped || matched ? "default" : "pointer"}}>

            <div className="front"></div>
            <div className="back" > <img src={tile.image} alt={tile.value} style={{width: "80%", height: "80%", objectFit: "contain"}} 
            />
             </div>
             </div>
    );
}