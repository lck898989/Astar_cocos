import Grid from "./Grid";
import Tool from "../utils/tool";
import ResourcesManager from "../manager/ResourcesManager";
import Point from "./Point";
import Hero from "./Hero";
import Astar from "../controllers/Astar";
const {ccclass, property} = cc._decorator;
/**
 *
 * 
 *
 * @export
 * @class Map
 * @extends {cc.Component}
 */
@ccclass
export default class Map extends cc.Component{

    /*** 地图所需要的行列 */
    @property({type: cc.Integer})
    public row: number = 0;
    @property({type: cc.Integer})
    public col: number = 0;
    @property({type: cc.Prefab})
    public gridPrefab: cc.Prefab = null;
    @property({type: cc.Prefab})
    public heroNode: cc.Prefab = null;

    @property({type: cc.Node})
    public con: cc.Node = null;


    public hero: cc.Node = null;
    /*** 网格二维数组 */
    public gridMap: Grid[][] = [];
    public points: Point[][] = [];

    /*** 位置map */
    public locationMap: cc.Vec2[][] = [];

    /*** 地图的宽高 */
    public mapWidth: number = 0;
    public mapHeigth: number = 0;


    public startNode: Point;
    public endNode: Point;

    /*** 网格宽高 */
    private gridWidth: number = 0;
    private gridHeight: number = 0;

    private barryPointArr: cc.Vec2[] = [];

    private levelData: any;

    private aStar: Astar = null;

    private heroLocation: cc.Vec2 = cc.v2(0,0);

    private gtx: cc.Graphics = null;

    async onLoad() {
        this.gtx = this.con.getChildByName("draw").getComponent(cc.Graphics);

        this.mapWidth = this.node.width;
        this.mapHeigth = this.node.height;

        this.gridWidth = this.mapWidth / this.col;
        this.gridHeight = this.mapHeigth / this.row;

        let levelJson = await ResourcesManager.getInstance().loadres("level0.json");
        console.log("levelJson is ",levelJson);
        this.levelData = levelJson.json;
        /** 生成网格 */
        this.initMap();
        this.initHero();

        this.aStar = new Astar();
        this.startNode = this.points[this.heroLocation.y][this.heroLocation.x];


    }

    private initMap() {
        this.gridMap = [];
        this.locationMap = [];
        this.points = [];
        for(let i = 0; i < this.row; i++) {
            this.gridMap[i] = [];
            this.locationMap[i] = [];
            for(let j = 0; j < this.col; j++) {
                if(!this.points[j]) {
                    this.points[j] = [];
                }
                let gridNode: cc.Node = cc.instantiate(this.gridPrefab);
                gridNode.width = this.gridWidth;
                gridNode.height = this.gridHeight;
                let gridCom: Grid = gridNode.getComponent(Grid);
                
                gridCom.row = i;
                gridCom.col = j;

                
                this.node.addChild(gridNode);
                gridNode.x = -this.mapWidth / 2 + j * this.gridWidth + this.gridWidth / 2;
                gridNode.y = -this.mapHeigth / 2 + i * this.gridHeight + this.gridHeight / 2;
                
                this.locationMap[i][j] = cc.v2(gridNode.x,gridNode.y);
                
                this.gridMap[i][j] = gridCom;
                this.points[j][i] = new Point(j,i);

                if(this.xyIsInBarry(i,j)) {
                    gridNode.getChildByName("bg").color = cc.Color.BLACK;
                    this.points[j][i].walkable = false;
                }
            }
        }
    }

    private initHero() {
        let x: number = Tool.getRandomNum(0,this.row);
        let y: number = Tool.getRandomNum(0,this.col);

        while(this.xyIsInBarry(x,y)) {
            x = Tool.getRandomNum(0,this.row);
            y = Tool.getRandomNum(0,this.col);
        }
        this.heroLocation = cc.v2(x,y);
        let heroNode: cc.Node = cc.instantiate(this.heroNode);
        let heroCom: Hero = heroNode.getComponent(Hero);
        heroCom.row = x;
        heroCom.col = y;

        this.hero = heroNode;

        heroNode.setPosition(this.locationMap[x][y]);
        heroNode.width = this.gridWidth / 2;
        heroNode.height = this.gridHeight / 2;
        this.node.addChild(heroNode);
    }

    private xyIsInBarry(row: number,col: number): boolean {
        let res = false;
        if(this.levelData && this.levelData.barryPoint) {
            this.levelData.barryPoint.forEach(element => {
                if(element.x === row && element.y === col) {
                    res = true;
                }
            });
        }
        return res;
    }
    start(): void {
        cc.director.on("gridEvent",this.onGridEvent,this);

        // this.gtx.clear();
        // this.gtx.moveTo(0,0);
        // this.gtx.lineTo(100,100);
        // this.gtx.stroke();
    }
    private onGridEvent(data: any) {
        console.log("data is ",data);
        this.endNode = this.points[data.col][data.row];
        if(!this.endNode.walkable) {
            let replaceNode: Point = this.findReplacePoint(this.startNode,this.endNode);
            this.endNode = replaceNode;
        }
        if(this.aStar.findPath(this)) {
            console.log(this.aStar.Path);
            /*** 绘制路径 */
            this.drawPath(this.aStar.Path);
        }
    }
    private async drawPath(path: Point[]) {
        this.con.getChildByName("draw").zIndex = this.con.childrenCount - 1;
        this.gtx.clear();
        path.forEach((element,index) => {
            let row = element.y;
            let col = element.x;
            let pos: cc.Vec2 = this.locationMap[row][col];
            if(index === 0) {
                /** 开始节点 */
                this.gtx.moveTo(pos.x,pos.y);
            }

            this.gtx.lineTo(pos.x,pos.y);
        });
        this.gtx.stroke();
        let heroCom: Hero = this.hero.getComponent(Hero);

        for(let i = 0; i < path.length; i++) {
            let self = this;
            await new Promise((resolve,reject) => {
                let targetX: number = self.locationMap[path[i].y][path[i].x].x;
                let targetY: number = self.locationMap[path[i].y][path[i].x].y;
                console.log("targetX is ",targetX);
                console.log("targetY is ",targetY);
                cc.tween(self.hero).to(0.5,{position: cc.v3(targetX,targetY,0)}).call(() => {
                    heroCom.row = path[i].y;
                    heroCom.col = path[i].x;
                    resolve();
                }).start();
            })
            this.startNode.x = heroCom.col;
            this.startNode.y = heroCom.row;

        }

        console.log("gtx is ",this.gtx);
    }

    /**** 根据坐标获取节点 */
    public getPoint(x: number,y: number): Point {
        return this.points[x][y];
    }
    public setEndNode(x: number,y: number): void {
        this.endNode = this.points[x][y];
    }
    
    public setStartNode(x: number,y: number): void {
        this.startNode = this.points[x][y];
    }
    public setWalkable(x: number,y: number,value: boolean): void {
        this.points[x][y].walkable = value;
    }

    public get sp(): Point {
        return this.startNode;
    }
    
    /*** 判断两点之间是否存在障碍物 */
    public hasBarriers(startX: number,startY: number,endX: number,endY: number): boolean {
        if(startX == endX && startY == endY) {
            return false;
        }

        // 两节点中心位置
        let point1: cc.Vec2 = this.locationMap[startX][startY];
        let point2: cc.Vec2 = this.locationMap[endX][endY];
        
        let disX: number = Math.abs(endX - startX);
        let disY: number = Math.abs(endY - startY);

        // 遍历方向，为true时为横向遍历
        let loopDirection: boolean = disX > disY ? true: false;

        // 起始点与终点的连线方程
        let lineFunc: Function;

        let i: number;
        let loopStart: number;
        let loopEnd: number;

        /** 起始到终点所经过的节点 */
        let passedPointList: Point[];
        let passedPoint: Point;

        if(loopDirection) {
            lineFunc = Tool.getLineFunc(point1,point2,0);

            loopStart = Math.min(startX,endX);
            loopEnd = Math.max(startX,endX);

            /** 开始横向遍历看看起点和终点之间是否存在障碍物 */
            for(let i = loopStart; i < loopEnd; i++) {
                let xPos: number = i * this.gridWidth + this.gridWidth;
                let yPos: number = lineFunc(xPos);

                passedPointList = this.getPointsUnderPoint(i + 1,yPos / this.gridWidth);
                for(let idx in passedPointList) {
                    if(!passedPointList[idx].walkable) {
                        return true;
                    }
                }
            }
        } else {
            lineFunc = Tool.getLineFunc(point1,point2,1);
            loopStart = Math.min(startY,endY);
            loopEnd = Math.max(startY,endY);

            for(let i = loopStart; i < loopEnd; i++) {
                let yPos: number = i * this.gridHeight + this.gridHeight;
                let xPos: number = lineFunc(yPos);

                passedPointList = this.getPointsUnderPoint(xPos / this.gridHeight,i + 1);
                for(let idx in passedPointList) {
                    if(!passedPointList[idx].walkable) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    private getPointsUnderPoint(xPos: number,yPos: number,exception: Point[] = null): Point[] {
        let res: Point[] = [];
        let xIsInt: boolean = xPos % 1 == 0;
        let yIsInt: boolean = yPos % 1 == 0;

        // 该点由四个节点共享的情况
        if(xIsInt && yIsInt) {
            res[0] = this.getPoint(xPos - 1,yPos - 1);
            res[1] = this.getPoint(xPos,yPos - 1);
            res[2] = this.getPoint(xPos - 1,yPos);
            res[3] = this.getPoint(xPos,yPos);
        }
        // 点由两个节点共享 点落在两个节点的左右临边上
        else if(xIsInt && !yIsInt) {
            res[0] = this.getPoint(xPos - 1,Math.floor(yPos));
            res[1] = this.getPoint(xPos,Math.floor(yPos));
        } else if(!xIsInt && yIsInt) {
            res[0] = this.getPoint(Math.floor(xPos),yPos - 1);
            res[1] = this.getPoint(Math.floor(xPos),yPos);
        } else {
            res[0] = this.getPoint(Math.floor(xPos),Math.floor(yPos));
        }
        if(exception && exception.length > 0) {
            for(let i = 0; i < res.length; i++) {
                if(exception.indexOf(res[i]) != -1) {
                    res.splice(i,1);
                    i--;
                }
            }
        }
        return res;
    }

    /*** 当终点不可移动的时候 寻找一个最近的可移动的点 */
    public findReplacePoint(fromPoint: Point,toPoint: Point): Point {
        let result: Point;
        if(toPoint.walkable) {
            result = toPoint;
        } else {
            if(toPoint.buriedDepth == -1) {
                toPoint.buriedDepth = this.getPointBuriedDepth(toPoint,Math.max(this.row,this.col));
            }
            let xFrom: number = toPoint.x - toPoint.buriedDepth < 0 ? 0 : toPoint.x - toPoint.buriedDepth;
            let xTo: number = toPoint.x + toPoint.buriedDepth > this.col - 1 ? this.col - 1 : toPoint.x + toPoint.buriedDepth;
            let yFrom: number = toPoint.y - toPoint.buriedDepth < 0 ? 0 : toPoint.y - toPoint.buriedDepth;
            let yTo: number = toPoint.y + toPoint.buriedDepth > this.row - 1 ? this.row - 1 : toPoint.y + toPoint.buriedDepth;

            let n: Point;

            for(let i = xFrom; i <= xTo; i++) {
                for(let j = yFrom; j <= yTo; j++) {
                    if((i > xFrom && i < xTo) && (j > yFrom && j < yTo)) {
                        continue;
                    }
                    n = this.getPoint(i,j);
                    if(n.walkable) {
                        n.getDistanceTo(fromPoint);
                        if(!result) {
                            result = n;
                        } else if(n.distance < result.distance) {
                            result = n;
                        }
                    }
                }
            }
        }
        return result;

    }

    /*** 
     * 
     * 
     * 计算全部路径点的埋藏深度
     * 
     * 
    */
    public calculateBuriedDepth(): void {
        let node: Point;
        for(let i = 0; i < this.col; i++) {
            for(let j = 0; j < this.row; j++) {
                node = this.points[i][j];
                if(node.walkable) {
                    node.buriedDepth = 0;
                } else {
                    node.buriedDepth = this.getPointBuriedDepth(node,Math.max(this.col,this.row));
                }
            }
        }
    }

    /**
     *
     *
     * @param {Point} point 想计算节点的埋葬深度
     * @param {number} [loopCount=10]
     * @returns {number}
     * @memberof Map
     */
    public getPointBuriedDepth(point: Point,loopCount: number = 10): number {
        let result: number = point.walkable ? 0: 1;

        let l: number = 1;
        while(l <= loopCount) {
            let startX: number = point.x - l < 0 ? 0 : point.x - l;
            let endX: number = point.x + l > this.col - 1 ? this.col - 1 : point.x + l;
            let startY: number = point.y - l < 0 ? 0 : point.y - l;
            let endY: number = point.y + l > this.row ? this.row - 1 : point.y + l;

            let n: Point;

            // 遍历一个节点周围一圈是否都是不可移动点，若是深度加1
            for(let i = startX; i <= endX; i++) {
                for(let j = startY; j < endY; j++) {
                    n = this.getPoint(i,j);
                    if(n != point && n.walkable) {
                        return result;
                    }
                }
            }
            result++;
            l++;
        }
        return result;
    }
}