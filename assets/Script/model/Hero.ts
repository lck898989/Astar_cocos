const {ccclass, property} = cc._decorator;

@ccclass
export default class Hero extends cc.Component{
    
    public row: number;

    public col: number;

    public isWin: boolean = false;

}