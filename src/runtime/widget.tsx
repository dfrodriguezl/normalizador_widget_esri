import { React, type AllWidgetProps } from 'jimu-core'
import type { IMConfig } from '../config'
import {
  Button, Dropdown, DropdownButton, DropdownItem, DropdownMenu, Loading, TextInput
} from 'jimu-ui'
import { JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import { useEffect, useState } from 'react'
import FeatureLayer from 'esri/layers/FeatureLayer'
import './styles/style.scss';
import Graphic from 'esri/Graphic'
import Point from 'esri/geometry/Point'
import PictureMarkerSymbol from 'esri/symbols/PictureMarkerSymbol'
import { toast, ToastContainer } from "react-toastify";
import useAPIIA from './hooks/useAPIIA';
import ResultadoNormalizacionIA from './components/ResultadoNormalizacion';

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>();
  const [departamentos, setDepartamentos] = useState<{ nombre: string, codigo: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ nombre: string, codigo: string }[]>([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<{ nombre: string, codigo: string } | null>(null);
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState<{ nombre: string, codigo: string } | null>(null);
  const [direccion, setDireccion] = useState<string>('');
  const [respuestaApi, setRespuestaApi] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [cargandoDepartamentos, setCargandoDepartamentos] = useState(false);
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false);
  const [direccionInvalida, setDireccionInvalida] = useState<boolean>(false);
  const [errorCapturaDatos, setErrorCapturaDatos] = useState(false);
  const { fetchNormalizarDireccion, respuestaIA } = useAPIIA();

  useEffect(() => {
    if (!jimuMapView) return;

    const capaDeptos = jimuMapView.view.map.layers.find((layer) =>
      layer.title.includes('Departamentos')
    ) as FeatureLayer;

    console.log("tipooooo", capaDeptos.type);

    if (capaDeptos && 'queryFeatures' in capaDeptos) {
      console.log("entroooooo");
      setCargandoDepartamentos(true);
      capaDeptos.queryFeatures({
        where: '1=1',
        outFields: ['dpto_ccdgo', 'dpto_cnmbr'],
        returnGeometry: false
      }).then((res) => {
        if (res.features.length === 0) {
          toast.error("No se obtuvieron datos de departamentos");
          setErrorCapturaDatos(true)
          return;
        }
        const lista = res.features.map(f => ({
          nombre: f.attributes.dpto_cnmbr,
          codigo: f.attributes.dpto_ccdgo
        }));
        setDepartamentos(lista);
      }).catch((error) => {
        console.error("Información de departamentos no obtenida:", error);
        toast.error("Información de departamentos no obtenida. Revisa la consola para más detalles.");
        setErrorCapturaDatos(true)
      }).finally(() => {
        setCargandoDepartamentos(false);
      });
    } else {
      console.log("entroooooo aca");
    }
  }, [jimuMapView]);

  useEffect(() => {
    if (!jimuMapView || !departamentoSeleccionado) return;

    const capaMpios = jimuMapView.view.map.layers.find((layer) =>
      layer.title.includes('Municipios')
    ) as FeatureLayer;

    if (capaMpios && 'queryFeatures' in capaMpios) {
      setCargandoMunicipios(true);
      capaMpios.queryFeatures({
        where: `dpto_ccdgo = '${departamentoSeleccionado.codigo}'`,
        outFields: ['mpio_cnmbr', 'mpio_ccdgo'],
        returnGeometry: false
      }).then((res) => {
        if (res.features.length === 0) {
          toast.error("No se obtuvieron datos de municipios");
          setErrorCapturaDatos(true);
          return;
        }
        const lista = res.features.map(f => ({
          nombre: f.attributes.mpio_cnmbr,
          codigo: f.attributes.mpio_ccdgo
        }));
        setMunicipios(lista);
        setMunicipioSeleccionado(null);
      }).catch((error) => {
        console.error("Información de departamentos no obtenida:", error);
        toast.error("Información de departamentos no obtenida. Revisa la consola para más detalles.");
        setErrorCapturaDatos(true);
      }).finally(() => {
        setCargandoMunicipios(false);
      });
    }
  }, [departamentoSeleccionado]);

  const handleDireccionChange = (e) => {
    const valor = e.target.value;
    setDireccion(valor);
    setDireccionInvalida(valor.length < 10);
  };

  const ejecutarAPI = async (tipo: 'normalizar' | 'georeferenciar') => {
    const urlBase = tipo === 'normalizar'
      ? 'https://apinormalizador.dane.gov.co/normalizardireccion'
      : 'https://apinormalizador.dane.gov.co/georeferenciardireccion';

    const url = `${urlBase}?dir=${encodeURIComponent(direccion)}&depto=${departamentoSeleccionado.codigo}&mpio=${municipioSeleccionado.codigo}`;

    setLoading(true);

    if (tipo === 'normalizar') {
      try {
        await fetchNormalizarDireccion(direccion);
      } catch (error) {
        toast.error('Error al normalizar dirección: ', error)
      }

      if (respuestaIA?.direccion_salida) {
        toast.success('Normalización completa')
      } else {
        toast.warning(`Normalización no realizada: ${respuestaIA?.direccion_salida}`)
      }

      setLoading(false);

      return;
    }

    fetch(url)
      .then(response => response.json())
      .then(data => {
        setRespuestaApi(data);
        jimuMapView.view.graphics.removeAll();

        if (tipo === 'georeferenciar' && data.georeferenciacion) {
          const { latitud, longitud, tipo } = data.georeferenciacion;
          const { direccion_normalizada } = data.normalizacion;
          const dir = data.dir;


          if (latitud == '' || longitud == '') {
            toast.warning(`Georreferenciación no realizada: ${tipo}`)
            return
          }

          toast.success(`Georreferenciación: ${tipo}`)

          const point = new Point({
            x: longitud,
            y: latitud,
            spatialReference: { wkid: 4326 },
          });

          const symbol = new PictureMarkerSymbol({
            url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 512 512">
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#2e6da4" flood-opacity="0.6"/>
                  </filter>
                </defs>
                <path d="M256 0C156.698 0 76 80.698 76 180c0 118.667 161.667 318.667 171.333 330.667a20 20 0 0 0 29.333 0C274.333 498.667 436 298.667 436 180 436 80.698 355.302 0 256 0z" fill="#b91450" filter="url(#shadow)"/>
                <circle cx="256" cy="180" r="60" fill="#fff"/>
              </svg>
            `),
            width: '32px',
            height: '32px'
          });



          const popupTemplate = {
            title: 'Dirección georreferenciada',
            content: `
              <b>Departamento:</b> ${departamentoSeleccionado.nombre}<br/>
              <b>Municipio:</b> ${municipioSeleccionado.nombre}<br/>
              <b>Dirección ingresada:</b> ${dir}<br/>
              <b>Latitud:</b> ${latitud}<br/>
              <b>Longitud:</b> ${longitud}<br/>
              <b>Tipo:</b> ${tipo}<br/>
              <b>Dirección estandarizada:</b> ${direccion_normalizada}
            `,
          };

          const graphic = new Graphic({
            geometry: point,
            symbol: symbol,
            attributes: { latitud, longitud },
            popupTemplate,
          });

          jimuMapView.view.graphics.add(graphic);
          jimuMapView.view.goTo({ target: [longitud, latitud], zoom: 16 });
        }
      })
      .catch(error => {
        toast.error('Error al consultar la API: ', error)
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      {!errorCapturaDatos ? (
        <div className="widget-formulario" style={{ maxHeight: '100%', overflowY: 'auto' }}>

          {(loading || cargandoDepartamentos || cargandoMunicipios) && (
            <div className="loading-overlay">
              <Loading type="DONUT" />
            </div>
          )}

          <div className="dropdown-container">
            <p><strong>Departamento</strong></p>
            <Dropdown direction="down" menuRole="menu" size="default">
              <DropdownButton>
                {departamentoSeleccionado?.nombre || 'Seleccione un departamento'}
              </DropdownButton>
              <DropdownMenu>
                {departamentos.map(dep => (
                  <DropdownItem key={dep.codigo} onClick={() => setDepartamentoSeleccionado(dep)}>
                    {dep.nombre}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="dropdown-container">
            <p><strong>Municipio</strong></p>
            <Dropdown direction="down" menuRole="menu" size="default" disabled={!departamentoSeleccionado}>
              <DropdownButton>
                {municipioSeleccionado?.nombre || 'Seleccione un municipio'}
              </DropdownButton>
              <DropdownMenu>
                {municipios.map(mpio => (
                  <DropdownItem key={mpio.codigo} onClick={() => setMunicipioSeleccionado(mpio)}>
                    {mpio.nombre}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="dropdown-container">
            <p><strong>Dirección</strong></p>
            <TextInput
              className="jimu-input"
              type="text"
              style={{ marginBottom: 0 }}
              value={direccion}
              onChange={handleDireccionChange}
              disabled={!departamentoSeleccionado || !municipioSeleccionado}
            />
            {direccionInvalida && direccion.length > 0 && (
              <p className="advertencia">La dirección debe tener al menos 10 caracteres.</p>
            )}
          </div>

          <div className="button-row">
            <div className="button-container">
              <Button onClick={() => ejecutarAPI('normalizar')} size="default" disabled={direccionInvalida || direccion.length < 10}>
                Normalizar
              </Button>
            </div>
            <div className="button-container">
              <Button
                onClick={() => ejecutarAPI('georeferenciar')}
                size="default"
                disabled={direccionInvalida || direccion.length < 10 || !departamentoSeleccionado || !municipioSeleccionado}>
                Georreferenciar
              </Button>
            </div>
          </div>

          {/* Resultado normalización IA */}
          {respuestaIA && (
            <ResultadoNormalizacionIA
              respuestaIA={respuestaIA}
              departamentoSeleccionado={departamentoSeleccionado}
              municipioSeleccionado={municipioSeleccionado}
            />
          )}

          {respuestaApi && (
            <div className="respuesta-api">
              {(respuestaApi.dir_normalizada?.direccion_normalizada || respuestaApi.georeferenciacion?.latitud !== '') && (
                <>
                  <p><strong>Departamento:</strong> {departamentoSeleccionado?.nombre}</p>
                  <p><strong>Municipio:</strong> {municipioSeleccionado?.nombre}</p>

                  <p><strong>Dirección ingresada:</strong> {
                    respuestaApi.dir
                  }</p>

                  <p><strong>Dirección estandarizada:</strong> {
                    respuestaApi.dir_normalizada?.direccion_normalizada ||
                    respuestaApi.normalizacion?.direccion_normalizada
                  }</p>

                  <p><strong>Tipo:</strong> {
                    respuestaApi.dir_normalizada?.tipo ||
                    respuestaApi.normalizacion?.tipo
                  }</p>

                  <p><strong>Normalización completa:</strong> {
                    respuestaApi.dir_normalizada?.normalizacion_completa ||
                    respuestaApi.normalizacion?.normalizacion_completa
                  }</p>

                  <p><strong>DIRECCIÓN NORMALIZADA</strong></p>

                  {(respuestaApi.dir_normalizada?.tipo_via_ppal ||
                    respuestaApi.normalizacion?.tipo_via_ppal)
                    && <p><strong>Tipo vía principal:</strong> {
                      respuestaApi.dir_normalizada?.tipo_via_ppal ||
                      respuestaApi.normalizacion?.tipo_via_ppal}
                    </p>}

                  {(respuestaApi.dir_normalizada?.numero_via_ppal ||
                    respuestaApi.normalizacion?.numero_via_ppal)
                    && <p><strong>Número vía principal:</strong> {
                      respuestaApi.dir_normalizada?.numero_via_ppal ||
                      respuestaApi.normalizacion?.numero_via_ppal}
                    </p>}

                  {(respuestaApi.dir_normalizada?.adicional_via_ppal ||
                    respuestaApi.normalizacion?.adicional_via_ppal)
                    && <p><strong>Letra vía principal:</strong> {
                      respuestaApi.dir_normalizada?.adicional_via_ppal ||
                      respuestaApi.normalizacion?.adicional_via_ppal}
                    </p>}

                  {(respuestaApi.dir_normalizada?.bis_via_ppal ||
                    respuestaApi.normalizacion?.bis_via_ppal)
                    && <p><strong>BIS vía principal:</strong> {
                      respuestaApi.dir_normalizada?.bis_via_ppal ||
                      respuestaApi.normalizacion?.bis_via_ppal}
                    </p>}

                  {(respuestaApi.dir_normalizada?.cuadrante_via_ppal ||
                    respuestaApi.normalizacion?.cuadrante_via_ppal)
                    && <p><strong>Cuadrante vía principal:</strong> {
                      respuestaApi.dir_normalizada?.cuadrante_via_ppal ||
                      respuestaApi.normalizacion?.cuadrante_via_ppal}
                    </p>}

                  {(respuestaApi.dir_normalizada?.numero_via_gen ||
                    respuestaApi.normalizacion?.numero_via_gen)
                    && <p><strong>Número vía generadora:</strong> {
                      respuestaApi.dir_normalizada?.numero_via_gen ||
                      respuestaApi.normalizacion?.numero_via_gen}
                    </p>}

                  {(respuestaApi.dir_normalizada?.adicional_via_gen ||
                    respuestaApi.normalizacion?.adicional_via_gen)
                    && <p><strong>Letra vía generadora:</strong> {
                      respuestaApi.dir_normalizada?.adicional_via_gen ||
                      respuestaApi.normalizacion?.adicional_via_gen}
                    </p>}

                  {(respuestaApi.dir_normalizada?.bis_via_gen ||
                    respuestaApi.normalizacion?.bis_via_gen)
                    && <p><strong>BIS vía generadora:</strong> {
                      respuestaApi.dir_normalizada?.bis_via_gen ||
                      respuestaApi.normalizacion?.bis_via_gen}
                    </p>}

                  {(respuestaApi.dir_normalizada?.numero_placa ||
                    respuestaApi.normalizacion?.numero_placa)
                    && <p><strong>Número placa:</strong> {
                      respuestaApi.dir_normalizada?.numero_placa ||
                      respuestaApi.normalizacion?.numero_placa}
                    </p>}

                  {(respuestaApi.dir_normalizada?.cuadrante_via_generadora ||
                    respuestaApi.normalizacion?.cuadrante_via_generadora)
                    && <p><strong>Cuadrante vía generadora:</strong> {
                      respuestaApi.dir_normalizada?.cuadrante_via_generadora ||
                      respuestaApi.normalizacion?.cuadrante_via_generadora}
                    </p>}


                </>
              )}
            </div>
          )}

          {props.useMapWidgetIds?.length === 1 && (
            <JimuMapViewComponent
              useMapWidgetId={props.useMapWidgetIds[0]}
              onActiveViewChange={(jmv: JimuMapView) => setJimuMapView(jmv)}
            />
          )}
        </div>
      ) : (
        <div style={{ padding: 20 }}>
          <p style={{ color: 'red', textAlign: 'justify' }}><strong>Error:</strong> No se pudo obtener información de departamentos y municipios. Por favor, revise que las capas del mapa funcionen adecuadamente.</p>
        </div>
      )}


      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        theme="light"
      />

    </>
  )
}

export default Widget