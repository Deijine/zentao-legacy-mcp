# 获取项目列表

|  方法说明 请求此方法，可以根据项目不同状态获取项目列表。
|  使用示例  

```
public function getProjectList()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $params      = array('status' => 'doing');    // 请求参数
    $extraFields = array('title', 'projects', 'projectStats', 'teamMembers', 'users');    // 自定义返回字段
    $result      = $zentao->getProjectList($params, $extraFields);
    return $result;
}
```

|  请求方式  GET 
|  方法名称  getProjectList 
|  请求参数  
|  参数名称  参数类型  是否必填  参数描述 
|  status
 string  选填参数  项目状态【all:所有|undone:未完成|wait:未开始|doing:进行中|suspended:已挂起|closed:已关闭】

|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
         //当前禅道项目导航位置
        "title": "所有项目",
        //项目名称列表
        "projects": {
            "1": "禅道系统 PHP-SDK 开发",
            "2": "淘宝项目开发",
            "3": "天猫项目开发"
        },
        //项目详情列表
        "projectStats": [
            {
                "id": "1",//项目ID
                "isCat": "0",
                "catID": "0",
                "type": "sprint",//项目类型【sprint短期项目|waterfall长期项目|ops运维项目】
                "parent": "0",
                "name": "禅道系统 PHP-SDK 开发",//项目名称
                "code": "002",//项目代号
                "begin": "2019-11-11",//起始日期
                "end": "2019-11-23",//起始日期
                "days": "10",//可用工作日
                "status": "doing",//项目状态【all所有|undone未完成|wait未开始|doing进行中|suspended已挂起|closed已关闭】
                "subStatus": "",
                "statge": "1",
                "pri": "1",
                "desc": "开发禅道项目管理系统 PHP-SDK 的开发，用于 PHPer 高效便捷的进行项目管理。",//项目描述
                "openedBy": "admin",//创建者
                "openedDate": "2019-11-11 15:24:14",//创建时间
                "openedVersion": "11.6.4",//禅道版本
                "closedBy": "",//关闭者
                "closedDate": "0000-00-00 00:00:00",//关闭时间
                "canceledBy": "",//取消者
                "canceledDate": "0000-00-00 00:00:00",//取消时间
                "PO": "zhangsan",//产品负责人
                "PM": "niuqi",//项目负责人
                "QD": "admin",//测试负责人
                "RD": "lisi",//发布负责人
                "team": "禅道开发",//团队名称
                "acl": "open",//访问控制【open默认|private私有|custom自定义白名单】
                "whitelist": "",//白名单列表
                "order": "5",//排序数
                "deleted": "0",
                "burns": [//燃尽图数据
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    "28"
                ],
                "hours": {
                    "totalEstimate": 28,//预计时间（小时）
                    "totalConsumed": 21,//消耗时间（小时）
                    "totalLeft": 28,//剩余时间（小时）
                    "progress": 42.9,//进度（百分比）
                    "totalReal": 49
                }
            } ],
        //团队成员列表信息
        "teamMembers": {
            "admin": {
                "id": "9",
                "root": "2",
                "type": "project",
                "account": "admin",
                "role": "",
                "limited": "no",
                "join": "2019-11-20",
                "days": "8",
                "hours": "7.0",
                "estimate": "0.00",
                "consumed": "0.00",
                "left": "0.00",
                "order": "0",
                "totalHours": "56.0",
                "realname": "admin"
            },
            "niuqi": {
                "id": "11",
                "root": "2",
                "type": "project",
                "account": "niuqi",
                "role": "其他",
                "limited": "no",
                "join": "2019-11-20",
                "days": "8",
                "hours": "7.0",
                "estimate": "0.00",
                "consumed": "0.00",
                "left": "0.00",
                "order": "0",
                "totalHours": "56.0",
                "realname": "牛七"
            },
            "wangwu": {
                "id": "12",
                "root": "2",
                "type": "project",
                "account": "wangwu",
                "role": "研发",
                "limited": "no",
                "join": "2019-11-20",
                "days": "8",
                "hours": "7.0",
                "estimate": "0.00",
                "consumed": "0.00",
                "left": "0.00",
                "order": "0",
                "totalHours": "56.0",
                "realname": "王五"
            },
            "zhapliu": {
                "id": "10",
                "root": "2",
                "type": "project",
                "account": "zhapliu",
                "role": "测试",
                "limited": "no",
                "join": "2019-11-20",
                "days": "8",
                "hours": "7.0",
                "estimate": "0.00",
                "consumed": "0.00",
                "left": "0.00",
                "order": "0",
                "totalHours": "56.0",
                "realname": "赵六"
            }
        },
        //用户列表信息
        "users": {
            "_empty_": "",
            "admin": "admin",
            "lisi": "李四",
            "niuqi": "牛七",
            "wangwu": "王五",
            "zhangsan": "张三",
            "zhapliu": "赵六",
            "closed": "Closed"
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
