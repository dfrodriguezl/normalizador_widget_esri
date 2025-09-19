import { React,  IMState, AllWidgetProps } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { SettingSection, MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import { IMConfig } from '../config'

interface ExtraProps {
    filterWidgets: any
}

/**
 * Componente de configuración para el widget.
 *
 * @component
 * @param {AllWidgetSettingProps<IMConfig> & ExtraProps} props - Propiedades del componente.
 * @returns {React.ReactNode} - Elemento de React que representa la interfaz de configuración.
 */
export default function Setting(props: AllWidgetSettingProps<IMConfig> & ExtraProps) {

    /**
     * Maneja el cambio en la selección de widgets de mapa y actualiza la configuración.
     *
     * @param {string[]} useMapWidgetIds - Identificadores de widgets de mapa seleccionados.
     * @returns {void} - No devuelve nada.
     */
    const onChangeMapWidget = (useMapWidgetIds: string[]) => {
        props.onSettingChange({
            id: props.id,
            useMapWidgetIds: useMapWidgetIds
        })
    }

    return (
        <div className="widget-setting">
            <SettingSection title="Widget de mapa">
                <MapWidgetSelector 
                    useMapWidgetIds={props.useMapWidgetIds}
                    onSelect={onChangeMapWidget}
                />
            </SettingSection>
        </div>
    )
}