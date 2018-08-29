import {
    IUnitsResponse,
    IUnitsResponseDataItem,
    IUnitItem,
    IUnitsResponseIndicator,
    IUnitItemProduct
} from '../globals/models/unitInfo.model';
import { flatMap } from '../../utils';
import { IUnitType, IUnitTypesResponse, IUnitTypesResponseItem } from './models/unitType.model';

export class GlobalsHelper {

    private static mapProducts = (responseItem: IUnitsResponseDataItem): IUnitItemProduct[] => {
        const idsString = (responseItem.product_ids || '{}'),
            ids = idsString
                .slice(1, idsString.length - 1)
                .split(',')
                .map(stringId => Number(stringId)),
            symbolsString = (responseItem.product_symbols || '{}'),
            product_symbols = symbolsString
                .slice(1, symbolsString.length - 1)
                .replace(/"/g, '')
                .split(','),
            namesString = (responseItem.product_names || ''),
            product_names = namesString
                .slice(1, namesString.length - 1)
                .replace(/"/g, '')
                .split(',');

        return ids.map((id, i) => {
            return {
                id,
                symbol: product_symbols[i],
                name: product_names[i]
            };
        }) || [];
    }

    public static parseUnitsResponse = (response: IUnitsResponse): IUnitItem[] => {
        return flatMap(response.data)
            .map((responseItem: IUnitsResponseDataItem) => {
                return {
                    id: Number(responseItem.id),
                    name: responseItem.name,
                    country_symbol: responseItem.country_symbol,
                    country_name: responseItem.country_name,
                    region_name: responseItem.region_name,
                    city_name: responseItem.city_name,
                    unit_type_id: Number(responseItem.unit_type_id),
                    unit_type_symbol: responseItem.unit_type_symbol,
                    unit_type_name: responseItem.unit_type_name,
                    size: Number(responseItem.size),
                    labor_max: Number(responseItem.labor_max),
                    equipment_max: Number(responseItem.equipment_max),
                    square: Number(responseItem.square),
                    unit_type_produce_name: responseItem.unit_type_produce_name,
                    unit_class_id: Number(responseItem.unit_class_id),
                    unit_class_name: responseItem.unit_class_name,
                    unit_class_kind: responseItem.unit_class_kind,
                    productivity: Number(responseItem.productivity),
                    notice: responseItem.notice,
                    market_status: responseItem.market_status,
                    time_to_build: Number(responseItem.time_to_build),
                    office_sort: Number(responseItem.office_sort),
                    products: GlobalsHelper.mapProducts(responseItem),
                    indicators: Object.keys(response.indicators)
                        .filter((key: string) => Number(responseItem.id) === Number(key))
                        .map((key: string) => flatMap(response.indicators[key])
                            .map((item: IUnitsResponseIndicator) => ({
                                id: Number(item.id),
                                kind: item.kind,
                                name: item.name
                            }))
                        )[0] || []
                };
            });
    }

    public static parseUnitTypesResponse = (response: IUnitTypesResponse): IUnitType[] => {
        return flatMap(response)
            .map((responseItem: IUnitTypesResponseItem) => ({
                ...responseItem,
                id: Number(responseItem.id),
                industry_id: Number(responseItem.industry_id),
                class_id: Number(responseItem.class_id),
                need_technology: responseItem.need_technology === 't',
                labor_max: Number(responseItem.labor_max),
                equipment_max: Number(responseItem.equipment_max),
                square: Number(responseItem.square),
                building_time: Number(responseItem.building_time)
            }));
    }
}
