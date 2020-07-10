export default class ResourcesManager {
    private static instance: ResourcesManager;

    public static getInstance(): ResourcesManager {
        if(!this.instance) {
            this.instance = new ResourcesManager();
        } 
        return this.instance;
    }

    public async loadres(path: string): Promise<any> {
        return new Promise((resolve,reject) => {
            cc.loader.loadRes(path,(err,res) => {
                if(err) {
                    reject();
                    return;
                }
                resolve(res);
            })
        })
    }
}