# 完成单个任务可选信息

|  
方法说明 
请求此方法，可以获取该任务的所属项目详情、任务详情、任务操作记录，同时获取用于指派完成的用户列表。
|  使用示例

```
public function getTaskFinishParams()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $params      = array('taskID' => 1);    // 请求参数
    $extraFields = array('title', 'users', 'task', 'project', 'actions');    // 自定义返回字段
    $result      = $zentao->getTaskFinishParams($params, $extraFields);
    return $result;
}
```

|  请求方式
 GET 
|  方法名称
 getTaskFinishParams 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  taskID
 int  必填参数 任务ID

|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
         //当前禅道项目导航位置
        "title": "禅道系统 PHP-SDK 开发-完成",
        //可用指派用户列表
        "users": {
            "_empty_": "",
            "admin": "A:admin",
            "lisi": "L:李四",
            "niuqi": "N:牛七",
            "wangwu": "W:王五",
            "zhangsan": "Z:张三",
            "zhapliu": "Z:赵六"
        },
        //任务详情信息
        "task": {
            "id": "1",
            "parent": "0",
            "project": "1",
            "module": "1",
            "story": "1",
            "storyVersion": "1",
            "fromBug": "0",
            "name": "确认禅道PHP-SDK需求，创建PHP-SDK文件 ",
            "type": "design",
            "pri": "1",
            "estimate": "4",
            "consumed": "6",//之前消耗时长【小时】
            "left": "0",
            "deadline": "2019-11-11",
            "status": "done",
            "subStatus": "",
            "color": "",
            "mailto": "",
            "desc": "创建 zentao.sdk.class 文件，做好基本的用户认证，分析需求，开始进行功能开发。",
            "openedBy": "admin",
            "openedDate": "2019-11-11 15:29:27",
            "assignedTo": "admin",
            "assignedDate": "2019-11-20 15:30:15",
            "estStarted": "2019-11-11",
            "realStarted": "2019-11-11",
            "finishedBy": "admin",
            "finishedDate": "2019-11-20 15:30:15",
            "finishedList": "",
            "canceledBy": "",
            "canceledDate": "",
            "closedBy": "",
            "closedDate": "",
            "closedReason": "",
            "lastEditedBy": "admin",
            "lastEditedDate": "2019-11-20 15:30:15",
            "deleted": "0",
            "storyID": "1",
            "storyTitle": "确认禅道PHP-SDK需求，创建PHP-SDK文件",
            "latestStoryVersion": "1",
            "storyStatus": "active",
            "assignedToRealName": "admin",
            "children": [],
            "team": [],
            "files": [],
            "cases": [],
            "needConfirm": false,
            "progress": 100,
            "nextBy": "admin"
        },
        //所属项目详情信息
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
            "PO": "lisi",
            "PM": "lisi",
            "QD": "lisi",
            "RD": "lisi",
            "team": "雷勇开发",
            "acl": "custom",
            "whitelist": "1,2",
            "order": "5",
            "deleted": "0",
            "totalHours": "420.0",
            "totalEstimate": 28,
            "totalConsumed": 33,
            "totalLeft": 5
        },
        //操作记录详情列表
        "actions": {
            "14": {
                "id": "14",
                "objectType": "task",
                "objectID": "1",
                "product": ",1,",
                "project": "1",
                "actor": "wangwu",
                "action": "started",
                "date": "2019-11-11 15:30:33",
                "comment": "",
                "extra": "",
                "read": "0",
                "history": [
                    {
                        "id": "2",
                        "action": "14",
                        "field": "realStarted",
                        "old": "0000-00-00",
                        "new": "2019-11-11",
                        "diff": ""
                    },
                    {
                        "id": "3",
                        "action": "14",
                        "field": "consumed",
                        "old": "0",
                        "new": "3",
                        "diff": ""
                    },
                    {
                        "id": "4",
                        "action": "14",
                        "field": "status",
                        "old": "wait",
                        "new": "doing",
                        "diff": ""
                    }
                ]
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
