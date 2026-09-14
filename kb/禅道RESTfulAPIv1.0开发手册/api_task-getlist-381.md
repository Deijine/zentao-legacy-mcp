# 获取任务列表

|  方法说明 调用此方法可以获取某个项目下不同状态的任务列表。注意：排序方式修改为降序排序，把 asc 修改为 desc 即可。
|  使用示例

```
public function getTaskList()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $params      = array('projectID' => 1, 'status' => 'all', 'orderBy' => 'pri_asc');    // 请求参数
    $extraFields = array('title', 'projects', 'project', 'products', 'tasks');    //自定义返回字段
    $result      = $zentao->getTaskList($params, $extraFields);
    return $result;
}
```

|  请求方式
 GET 
|  方法名称

getTaskList 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  projectID
 int  必填参数 项目ID

|  status
 string
 选填参数
 任务状态【all所有|unclosed未关闭|assignedtome指派给我|myinvolved由我参与|delayed已延期|needconfirm需求变更|wait未开始|doing进行中|undone未完成|finishedbyme我完成|done已完成|closed已关闭|cancel已取消】

|  orderBy
 string
 选填参数
 选填参数|排序方式【name_asc名称升序|pri_asc重要度升序|estimate_asc预计时间升序|consumed_asc消耗时间升序】

|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
        //当前禅道项目导航位置
        "title": "禅道系统 PHP-SDK 开发-任务列表",
        //已添加项目名称列表
        "projects": {
            "1": "禅道系统 PHP-SDK 开发"
        },
        //当前项目详情信息【可参考获取项目列表中的描述】
        "project": {
            "id": "1",
            "isCat": "0",
            "catID": "0",
            "type": "sprint",
            "parent": "0",
            "name": "禅道系统 PHP-SDK 开发",
            "code": "002",
            "begin": "2019-11-11",
            "end": "2019-11-23",
            "days": "10",
            "status": "doing",
            "subStatus": "",
            "statge": "1",
            "pri": "1",
            "desc": "开发禅道项目管理系统 PHP-SDK 的开发，用于 PHPer 高效便捷的进行项目管理。",
            "openedBy": "admin",
            "openedDate": "2019-11-11 15:24:14",
            "openedVersion": "11.6.4",
            "closedBy": "",
            "closedDate": "0000-00-00 00:00:00",
            "canceledBy": "",
            "canceledDate": "0000-00-00 00:00:00",
            "PO": "zhangsan",
            "PM": "niuqi",
            "QD": "admin",
            "RD": "lisi",
            "team": "禅道开发",
            "acl": "open",
            "whitelist": "",
            "order": "5",
            "deleted": "0",
            "totalHours": "420.0",
            "totalEstimate": 28,
            "totalConsumed": 25,
            "totalLeft": 0
        },
        //关联的产品列表信息
        "products": {
            "1": {
                "id": "1",
                "name": "禅道项目管理系统-PHP-SDK",
                "type": "normal",
                "branch": "0",
                "plan": "0"
            }
        },
        //此项目下任务列表信息
        "tasks": {
            "1": {
                "id": "1",//任务ID
                "parent": "0",
                "project": "1",//所属项目ID
                "module": "1",//所属模块ID
                "story": "1",
                "storyVersion": "1",
                "fromBug": "0",
                "name": "确认禅道PHP-SDK需求，创建PHP-SDK文件 ",//任务名称
                "type": "design",//任务类型
                "pri": "1",
                "estimate": "4",
                "consumed": "6",
                "left": "0",
                "deadline": "2019-11-11",
                "status": "done",
                "subStatus": "",
                "color": "",
                "mailto": "",
                "desc": "创建 zentao.sdk.class 文件，做好基本的用户认证，分析需求，开始进行功能开发。",//任务描述
                "openedBy": "admin",//创建者
                "openedDate": "2019-11-11 15:29:27",//创建时间
                "assignedTo": "admin",
                "assignedDate": "2019-11-20 15:30:15",
                "estStarted": "2019-11-11",
                "realStarted": "2019-11-11",
                "finishedBy": "admin",
                "finishedDate": "2019-11-20 15:30:15",
                "finishedList": "",
                "canceledBy": "",
                "canceledDate": "0000-00-00 00:00:00",
                "closedBy": "",
                "closedDate": "0000-00-00 00:00:00",
                "closedReason": "",
                "lastEditedBy": "admin",
                "lastEditedDate": "2019-11-20 15:30:15",
                "deleted": "0",
                "storyID": "1",
                "storyTitle": "确认禅道PHP-SDK需求，创建PHP-SDK文件",
                "product": "1",
                "branch": "0",
                "latestStoryVersion": "1",
                "storyStatus": "active",
                "assignedToRealName": "admin",
                "needConfirm": false,
                "productType": "normal",
                "progress": 100
            }
        }
    }
}
```

```
{
    "status": 0,
    "msg": "error",
    "result": []
}
```
