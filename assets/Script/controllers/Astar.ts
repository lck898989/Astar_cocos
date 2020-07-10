import Grid from "../model/Grid";
import Point from "../model/Point"
import Map from "../model/Map";

export default class Astar {
    /*** 开放列表用于存放待访问的节点 */
    private open: Point[];
    /** 封闭列表用于存放已经访问过的节点 */
    private closed: Point[];

    /** 节点网格数据对象 */
    private grid: Map;
    private endNode: Point;
    private startNode: Point;

    private path: Point[];
    private floyPath: Point[];
    /* 是否结束寻路 */
    public isEnd: boolean = false;

    /*** 启发函数 */
    private inspire: Function = this.manhanttan;

    /*** 直线代价权值 */
    private straighCost: number = 1.0;
    /*** 对角线代价权值 */
    private diagCost: number = Math.SQRT2;

    /** 斜线启发函数 */
    private diagonal(point: Point): number {
        let dx: number = Math.abs(point.x - this.endNode.x);
        let dy: number = Math.abs(point.y - this.endNode.y);

        let diag: number = dx < dy ? dx : dy;
        let straight: number = dx + dy;

        return 1.4 * diag + this.straighCost * (straight - 2 * diag);

    }
    /*** 曼哈顿距离启发函数 */
    private manhanttan(point: Point): number {
        return Math.abs(point.x - this.endNode.x) * this.straighCost + Math.abs(point.y - this.endNode.y) * this.straighCost;
    }

    private euclidian(node: Point): number {
        let dx: number = node.x - this.endNode.x;
        let dy: number = node.y - this.endNode.y;
        return Math.sqrt(dx * dx + dy * dy) * this.straighCost;
    }
    public findPath(grid: Map): boolean {
        /** 开始寻路 */
        this.isEnd = false;

        this.grid = grid
        this.open = [];
        this.closed = [];

        this.startNode = this.grid.startNode;
        this.endNode = this.grid.endNode;

        this.startNode.g = 0;
        this.startNode.h = this.inspire(this.startNode);
        this.startNode.f = this.startNode.g + this.startNode.h;

        /** 将该节点加入到开放列表中 */
        this.open[0] = this.startNode;
        return this.search();
    }
    /** 寻路 */
    public search(): boolean {
        let node: Point;
        while(!this.isEnd) {
            /** 当前节点在开放列表中的位置 */
            let currentNum: number;
            /** 在开放列表中找到具有最小f值的节点，并把查找到的节点作为下一个九宫格的中心节点 */
            let len = this.open.length;
            /** 从开放列表冲取出来一个节点待检测 */
            node = this.open[0];
            /*** 当前检测的索引位置为0 */
            currentNum = 0;
            for(let i = 0; i < len; i++) {
                /** 在开放列表中找到有最小值f的节点 */
                if(this.open[i].f < node.f) {        
                    node = this.open[i];
                    currentNum = i;
                }
            }

            // 将当前节点从开放列表中移除，加入到封闭列表
            this.open[currentNum] = this.open[this.open.length - 1];
            this.open.pop();
            this.closed.push(node);

            // 九宫格循环
            let startX: number = 0 > node.x - 1 ? 0: node.x - 1;
            let endX: number = this.grid.col - 1 < node.x + 1 ? this.grid.col - 1 : node.x + 1;
            let startY: number = 0 > node.y - 1 ? 0: node.y - 1;    
            let endY: number = this.grid.row - 1 < node.y + 1 ? this.grid.row - 1 : node.y + 1;

            for(let i = startX; i <= endX; i++) {
                for(let j = startY; j <= endY; j++) {
                    /** 当前要被探查的节点 */
                    let test: Point = this.grid.getPoint(i,j);
                    /** 测试节点位于当前中心节点的上下左右，并且是不可行走的话就继续探测下一个节点直到找到一个可行走的节点 */
                    if(test == node || !test.walkable || !this.grid.getPoint(node.x,test.y).walkable || !this.grid.getPoint(test.x,node.y)) {
                        continue;
                    }
                    let cost: number = this.straighCost;
                    if(!((node.x == test.x) || (node.y == test.y))) {
                        /** 斜线节点 */
                        cost = 1.4;
                        // continue;
                    }
                    let g: number = node.g + cost * test.costMultiplier;
                    let h: number = this.inspire(test);
                    let f: number = g + h;

                    /*** 一个节点最多只有一个parent这个parent就是使得它的f值最小的那个节点 */
                    /** 在开放列表或者是关闭列表中找到了说明该节点是已经被探测过的节点 */
                    if(this.open.indexOf(test) != -1 || this.closed.indexOf(test) != -1) {
                        if(f < test.f) {
                            test.f = f;
                            test.g = g;
                            test.h = h;
                            test.parent = node;
                        }
                    } else {
                        test.f = f;
                        test.g = g;
                        test.h = h;
                        test.parent = node;
                        /** 将可以走的节点加入到开放列表待检测 */
                        this.open.push(test);
                    }
                    /*** 如果待检测节点和结束节点相同就认为寻路结束 */
                    if(test == this.endNode) {
                        this.isEnd = true;
                    }
                }
            }
            /** 遍历一遍如果发现开放列表的传长度为空的话直接结束寻路 */
            if(this.open.length === 0) {
                this.isEnd = true;
                return false;
            }

        }
        this.buildPath();
        return true;
    }

    public get visited(): Point[] {
        return this.open;
    }
    public get Path(): Point[] {
        return this.path;
    }
    private buildPath(): void {
        console.log("closePath is ",this.closed);
        this.path = [];
        let node: Point = this.endNode;
        this.path.push(node);
        console.log("node is ",node);
        while(node != this.startNode) {
            if(node.parent) {
                node = node.parent;
                this.path.unshift(node);
            }
        }
    }
}