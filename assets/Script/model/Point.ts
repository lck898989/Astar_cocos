export default class Point {

    public x: number;
    public y: number;

    public f: number;
    public g: number;
    public h: number;

    public walkable: boolean = true;
    public alphable: boolean = false;
    public parent: Point;
    public costMultiplier: number = 1.0;
    /*** 埋葬深度 */
    public buriedDepth: number = -1;
    /*** 距离 */
    public distance: number;

    public constructor(x: number,y: number) {
        this.x = x;
        this.y = y;
    }
    public getDistanceTo(targetPoint: Point): number {
        let disX: number = targetPoint.x - this.x;
        let disY: number = targetPoint.y - this.y;
        this.distance = Math.sqrt(disX * disX + disY * disY);
        return this.distance;
    }
}
