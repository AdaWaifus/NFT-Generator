import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'toObjectKeys'
})
export class ToObjectKeys implements PipeTransform {

    transform(value: any): string[] {
        return Object.keys(value);

    }

}
