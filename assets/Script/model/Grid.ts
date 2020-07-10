const {ccclass, property} = cc._decorator;

@ccclass
export default class Grid extends cc.Component{

    // 是否是障碍物的格子
    public isBarry: boolean = false;
    // 格子的颜色
    public color: cc.Color = cc.Color.WHITE;

    /*** 格子所处的行 */
    public row: number = 0;
    /**** 格子所处的列 */
    public col: number = 0;

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START,this.tapGrid,this);
    }
    private tapGrid(event: cc.Event.EventTouch): void {
        cc.director.emit("gridEvent",{row: this.row,col: this.col});
    }
    start() {

    }
}
