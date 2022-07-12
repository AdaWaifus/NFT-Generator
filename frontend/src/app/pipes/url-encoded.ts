import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'urlEncode'
})
export class UrlEncodedPipe implements PipeTransform {

    transform(value: string): string {
        return encodeURIComponent(value);
    }

}
