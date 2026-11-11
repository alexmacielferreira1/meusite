export interface ArtLayer {
 id:string;name:string;kind:"text"|"image"|"rect"|"ellipse";
 x:number;y:number;width:number;height:number;rotation:number;opacity:number;visible:boolean;locked:boolean;
 fill:string;text?:string;src?:string;fontSize:number;fontFamily:string;weight:"400"|"700";align:"left"|"center"|"right";
 radius:number;fit:"cover"|"contain";brightness:number;contrast:number;saturation:number;flipX:boolean;flipY:boolean;
}
export interface ArtDocument {schema:"meusite-art/v1";width:number;height:number;background:string;layers:ArtLayer[]}
