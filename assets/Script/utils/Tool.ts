export default class Tool {
    public static getRandomNum(minNum: number,maxNum: number) {
        return Math.floor(Math.random() * (maxNum - minNum) + minNum);
    }

    /**
     *
     * 根据两个点获取该直线的方程
     *
     * @static
     * @param {cc.Vec2} point1
     * @param {cc.Vec2} point2
     * @param {number} [type=0]
     * @returns {Function}
     * @memberof Tool
     */
    public static getLineFunc(point1: cc.Vec2,point2: cc.Vec2,type: number = 0): Function {
        let resFunc: Function;

        if(point1.x === point2.x) {
            if(type === 0) {
                throw new Error("两点所确定的直线垂直于y轴，不能根据x值得到y值");
            } else if(type === 1) {
                
                resFunc = function(y: number): number {
                    return point1.x;
                }
            }
            return resFunc;
        } else if(point1.y === point2.y) {
            if(type === 0) {
                resFunc = function(x: number): number {
                    return point1.y;
                }
            } else if(type === 1) {
                throw new Error("两点所确定的直线垂直于y轴，不能根据x得到y");
            }
        }

        /* 当两点确定的直线不垂直于坐标轴的时候 y = ax + b */
        let a: number;
        /** 斜率 */
        a = (point1.y - point2.y) / (point1.x - point2.x);
        let b: number;
        b = point1.y - a * point1.x;

        if(type === 0) {
            resFunc = function(x: number): number {
                return a * x + b;
            }
        } else if(type === 1) {
            resFunc = function(y: number): number {
                return (y - b) / a;
            }
        }
        return resFunc;
    }
}