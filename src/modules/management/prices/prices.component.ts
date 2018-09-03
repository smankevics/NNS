import { ICalculateChoice } from './models/calculateChoice.model';
import { AllCalculateChoices } from './calcuateChoices/calculateChoices.component';
import { Globals } from '../../../shared/globals/globals.singletone';
import { IUnitItem } from '../../../shared/globals/models/unitInfo.model';
import { PricesService } from './prices.service';
import { Storage } from '../../../utils/storage';
import { IStorageProductSetting } from './models/storageProductSetting.model';
import { numberify } from '../../../utils';
import { Status } from '../../../shared/status/status.singletone';
import { LOG_STATUS } from '../../../shared/enums/logStatus.enum';

export class Prices {
    protected calculateChoices: ICalculateChoice[] = AllCalculateChoices;
    protected minPriceChoices: number[] = [0, 1, 1.1, 1.4, 1.6, 2];

    private readonly storageKey: string;

    private service: PricesService;
    private globals: Globals;
    private status: Status;
    private storageSettings: IStorageProductSetting[];

    constructor() {
        this.service = new PricesService();
        this.globals = Globals.getInstance();
        this.status = Status.getInstance();
        this.storageKey = `${this.globals.info.realm}/${this.globals.companyInfo.id}/${this.globals.pageInfo.pageType}/Prices`;
        this.storageSettings = [];
    }

    private getUnitItemByRow = (row: HTMLTableRowElement): IUnitItem => {
        return this.globals.unitsList.filter((u: IUnitItem) => u.id === Number($(row).find('.unit_id').text()))[0];
    }

    private createCalculateChoiceDropdown = (row: HTMLTableRowElement): string => {
        const unitInfo: IUnitItem = this.globals.unitsList
            .filter((unit: IUnitItem) => unit.id === Number($(row).find('.unit_id').text()))[0];

        if (!unitInfo || unitInfo.unit_class_kind !== 'shop') {
            return '';
        }

        return `
            <select class="price-select nns-select full-w mb-3">
                ${
                    this.calculateChoices.map((choice: ICalculateChoice) => {
                        return `<option title="${choice.description}">${choice.label}</option>`;
                    }).join('')
                }
            </select>
            <select class="min-price-select nns-select full-w">
                ${
                    this.minPriceChoices.map((choice: number) => {
                        return `<option title="minPrice = purchasePrice * ${choice}">${choice}</option>`;
                    }).join('')
                }
            </select>
        `;
    }

    private calculatePrices = (): void => {
        const filteredRows = $('table.unit-list-2014 tbody tr')
            .toArray()
            .filter((row: HTMLTableRowElement) => !$(row).hasClass('nns-hidden'))
            .filter((row: HTMLTableRowElement) => {
                const info = this.getUnitItemByRow(row);
                return info && info.unit_class_kind === 'shop';
            });

        this.status.start(filteredRows.length);
        this.status.log('Updating prices...', LOG_STATUS.SUCCESS);

        filteredRows
            .forEach((row: HTMLTableRowElement) => {
                const info = this.getUnitItemByRow(row),
                    priceChoiceValue = $(row).find('select.price-select').val(),
                    priceChoice = this.calculateChoices.filter(c => c.label === priceChoiceValue)[0],
                    minPriceMultiplier = Number($(row).find('select.min-price-select').val());
                this.service.updateUnitPrices(info, priceChoice, minPriceMultiplier)
                    .then(() => this.status.progressTick());
            });
    }

    private updateSettings = (): void => {
        Storage.set(this.storageKey, this.storageSettings, new Date());
    }

    private loadSettings = (): void => {
        const restored = Storage.get(this.storageKey),
            productSettings: IStorageProductSetting[] = restored ? restored.body.data : [];

        this.storageSettings = productSettings;
        productSettings.forEach((productSetting: IStorageProductSetting) => {
            const row = $('table.unit-list-2014 tbody tr')
                .toArray()
                .filter((r: HTMLTableRowElement) => numberify($(r).find('.unit_id').text()) === productSetting.unitId)[0];
            if (row) {
                $(row).find('select.price-select').val(productSetting.priceChoice);
                $(row).find('select.min-price-select').val(productSetting.minPriceChoice);
            }
        });
    }

    public addColumn = () => {
        $('table.unit-list-2014 colgroup').append(`<col style="width: 80px;">`);

        $('table.unit-list-2014 thead tr').toArray().forEach(row => {
            $(row).append(`<th class="management-separator prices center"></th>`);
        });
        $('table.unit-list-2014 thead tr:eq(1) th.prices').append(`
            <button id="prices-set-all" class="nns-button">Prices</button>
        `);
        $('#prices-set-all').on('click', this.calculatePrices);

        $('table.unit-list-2014 tbody tr')
            .toArray()
            .forEach((row: HTMLTableRowElement) => {
                $(row).append(`
                    <td class="management-separator prices">
                        ${this.createCalculateChoiceDropdown(row)}
                    </td>
                `);
        });

        // Price dropdown change
        $('select.price-select').on('change', (e) => {
            const row = $(e.target).parents('tr').get(),
                unitId = Number($(row).find('.unit_id').text()),
                existingSettings = this.storageSettings.filter((s: IStorageProductSetting) => s.unitId === unitId)[0];

            if (existingSettings) {
                existingSettings.priceChoice = $(e.target).val() as string;
            } else {
                this.storageSettings.push({
                    unitId,
                    priceChoice: $(e.target).val() as string,
                    minPriceChoice: String(this.minPriceChoices[0])
                });
            }
            this.updateSettings();
        });

        // Min price dropdown change
        $('select.min-price-select').on('change', (e) => {
            const row = $(e.target).parents('tr').get(),
                unitId = Number($(row).find('.unit_id').text()),
                existingSettings = this.storageSettings.filter((s: IStorageProductSetting) => s.unitId === unitId)[0];

            if (existingSettings) {
                existingSettings.minPriceChoice = $(e.target).val() as string;
            } else {
                this.storageSettings.push({
                    unitId,
                    priceChoice: this.calculateChoices[0].label,
                    minPriceChoice: $(e.target).val() as string
                });
            }
            this.updateSettings();
        });

        this.loadSettings();

    }
}