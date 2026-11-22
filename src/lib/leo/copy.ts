import type { Language } from '../player-languages';
const copy: Record<Language, [string,string,string]> = {
 en:['automated replies','Leo is typing…','Available when connected'],
 fr:['automated replies','Leo écrit…','Disponible avec une connexion'],
 ar:['automated replies','ليو يكتب…','متاح عند الاتصال'],
 pt:['automated replies','Leo está a escrever…','Disponível com ligação'],
 es:['automated replies','Leo está escribiendo…','Disponible con conexión'],
 sw:['automated replies','Leo anaandika…','Inapatikana ukiwa mtandaoni'],
 hi:['automated replies','Leo लिख रहा है…','कनेक्ट होने पर उपलब्ध'],
 ur:['automated replies','Leo لکھ رہا ہے…','انٹرنیٹ پر دستیاب'],
 am:['automated replies','Leo እየጻፈ ነው…','ግንኙነት ሲኖር ይገኛል'],
 ti:['automated replies','Leo ይጽሕፍ ኣሎ…','ምስ መርበብ ይርከብ'],
 so:['automated replies','Leo wuu qorayaa…','Waa la heli karaa marka la xiran yahay'],
 rw:['automated replies','Leo arandika…','Burahari kuri interineti'],
 rn:['automated replies','Leo arandika…','Buraboneka kuri interineti'],
 mg:['automated replies','Manoratra i Leo…','Misy rehefa mifandray'],
};
export const leoCopy=(language:Language)=>copy[language];