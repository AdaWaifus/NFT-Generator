import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {

    transform(value: any[] | null, filterBy: string|number, attribute: string): any[] | null {
        if (!value) return value;
        if (!filterBy) return value;
        const pipeModifier = filterBy;
        return value.filter(function (eachItem) {
            const value = eachItem[attribute];
            if (typeof value === 'string' || value instanceof String)
                return eachItem[attribute].toLowerCase().includes((pipeModifier as string).toLowerCase());
            else
                return eachItem[attribute] === +pipeModifier;
        });
    }

}
