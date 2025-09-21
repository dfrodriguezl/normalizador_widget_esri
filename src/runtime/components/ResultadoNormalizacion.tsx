import React from 'react';
import { ResponseIA } from '../interfaces/apiIA.interface';

interface ResultadoNormalizacionProps {
    respuestaIA: ResponseIA;
    departamentoSeleccionado: { nombre: string, codigo: string };
    municipioSeleccionado: { nombre: string, codigo: string };
}

const ResultadoNormalizacionIA = ({ respuestaIA, departamentoSeleccionado, municipioSeleccionado }: ResultadoNormalizacionProps) => {
    return (
        <div className="respuesta-api">
            <p><strong>Departamento:</strong> {departamentoSeleccionado?.nombre}</p>
            <p><strong>Municipio:</strong> {municipioSeleccionado?.nombre}</p>

            <p><strong>Dirección ingresada:</strong> {
                respuestaIA?.direccion_original
            }</p>

            <p><strong>Dirección estandarizada:</strong> {
                respuestaIA?.direccion_salida
            }</p>

            <p><strong>Normalización completa:</strong> {
                respuestaIA?.direccion_salida
            }</p>

            <p><strong>DIRECCIÓN NORMALIZADA</strong></p>

            {(respuestaIA?.via_principal ||
                respuestaIA?.via)
                && <p><strong>Tipo vía principal:</strong> {
                    respuestaIA?.via_principal}
                </p>}

            {(respuestaIA?.via)
                && <p><strong>Número vía principal:</strong> {
                    respuestaIA?.via}
                </p>}

            {(respuestaIA?.letra_via)
                && <p><strong>Letra vía principal:</strong> {
                    respuestaIA?.letra_via}
                </p>}

            {(respuestaIA?.prefijo_bis)
                && <p><strong>BIS vía principal:</strong> {
                    respuestaIA?.prefijo_bis}
                </p>}

            {(respuestaIA?.letra_bis)
                && <p><strong>Letra BIS vía principal:</strong> {
                    respuestaIA?.letra_bis}
                </p>}

            {(respuestaIA?.cuadrante)
                && <p><strong>Cuadrante vía principal:</strong> {
                    respuestaIA?.cuadrante}
                </p>}

            {(respuestaIA?.via_generadora)
                && <p><strong>Número vía generadora:</strong> {
                    respuestaIA?.via_generadora}
                </p>}

            {(respuestaIA?.letra_via_generadora)
                && <p><strong>Letra vía generadora:</strong> {
                    respuestaIA?.letra_via_generadora}
                </p>}

            {(respuestaIA?.prefijo_bis_generadora)
                && <p><strong>BIS vía generadora:</strong> {
                    respuestaIA?.prefijo_bis_generadora}
                </p>}

            {(respuestaIA?.letra_bis_generadora)
                && <p><strong>Letra BIS vía generadora:</strong> {
                    respuestaIA?.letra_bis_generadora}
                </p>}

            {(respuestaIA?.numero_placa)
                && <p><strong>Número placa:</strong> {
                    respuestaIA?.numero_placa}
                </p>}

            {(respuestaIA?.cuadrante)
                && <p><strong>Cuadrante vía generadora:</strong> {
                    respuestaIA?.cuadrante}
                </p>}
        </div>
    )
}

export default ResultadoNormalizacionIA;