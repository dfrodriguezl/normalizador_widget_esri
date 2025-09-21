import { useState } from "react";
import { RequestIA, ResponseIA } from "../interfaces/apiIA.interface";


const useAPIIA = () => {
    const [respuestaIA, setRespuestaIA] = useState<ResponseIA | null>(null);
    const url = 'https://geonormalizacion.dane.gov.co/normalizacion-ia/normalizar';

    /**
     * 
     * @param direccion Dirección a normalizar
     * @returns Respuesta de la API
     */
    const fetchNormalizarDireccion = async(direccion: string) => {
        const request: RequestIA = {
            userInput: direccion
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error('Error al normalizar dirección');
        }

        const data = await response.json();
        setRespuestaIA(data);
        return data;
        
    }

    return {
        fetchNormalizarDireccion,
        respuestaIA
    };
}

export default useAPIIA;