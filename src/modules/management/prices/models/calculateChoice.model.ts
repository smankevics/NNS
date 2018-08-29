import { IShopProduct } from '../../../../shared/models/shop.model';

export interface ICalculateChoice {
    label: string;
    description: string;

    calculate(product: IShopProduct): number;
}
