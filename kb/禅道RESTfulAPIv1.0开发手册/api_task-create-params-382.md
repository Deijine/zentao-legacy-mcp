# 添加单个任务可选信息

|  方法说明 
添加单个任务时，可以先通过此方法，获取添加任务中所需要的相关信息。
|  使用示例

```
public function getTaskCreateParams()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $params      = array('project' => 1);    // 请求参数
    $extraFields = array('title', 'projects', 'users', 'stories', 'moduleOptionMenu', 'project');    // 自定义返回字段
    $result      = $zentao->getTaskCreateParams($params, $extraFields);
    return $result;
}
```

|  请求方式
 GET 
|  方法名称

getTaskCreateParams 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  project
 int  必填参数 项目ID

|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
        //当前禅道项目导航位置
        "title": "禅道系统 PHP-SDK 开发-建任务",
        //所有项目名称列表
        "projects": {
            "1": "禅道系统 PHP-SDK 开发"
        },
        //可选用户列表【可用于指派和抄送】
        "users": {
            "_empty_": "",
            "admin": "A:admin",
            "lisi": "L:李四",
            "niuqi": "N:牛七",
            "wangwu": "W:王五",
            "zhangsan": "Z:张三",
            "zhapliu": "Z:赵六"
        },
        //该项目下的需求【可用于关联需求】
        "stories": {
            "1": "1:确认禅道PHP-SDK需求，创建PHP-SDK文件 (优先级:1,预计工时:4)",
            "2": "2:开发禅道SDK功能接口 (优先级:1,预计工时:24)",
            "_empty_": ""
        },
        //该项目所属模块列表【用于绑定所属模块】
        "moduleOptionMenu": [
            "/",
            "/设计",
            "/开发"
        ],
        //当前项目信息【描述参考 2.7 获取项目列表】
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
