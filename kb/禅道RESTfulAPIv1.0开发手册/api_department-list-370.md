# 获取部门列表

|  方法说明 
请求此方法，可以获取当前已添加部门列表数据，根据部门列表数据，后续可用于添加下级部门。
|  使用示例  

```
public function getDeptList() 
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $params      = array('deptID' => 1);    // 请求参数
    $extraFields = array('title', 'deptID', 'parentDepts', 'sons', 'tree');    // 自定义返回字段
    $result      = $zentao->getDeptList($params, $extraFields);
    return $result;
}

```

|  请求方式  GET 
|  方法名称  
getDeptList 
|  请求参数  
|  参数名称  参数类型  是否必填  参数描述 
|  
deptID  int  选填参数  某部门ID
|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
        //当前禅道项目导航位置
        "title": "维护部门-禅道项目管理",
        //当前部门ID
        "deptID": "1",
        //当前部门信息
        "parentDepts": [
            {
                "id": "1",
                "name": "经理",
                "parent": "0",
                "path": ",1,",
                "grade": "1",
                "order": "0",
                "position": "",
                "function": "",
                "manager": ""
            }
        ],
        //当前部门的直属下级部门列表
        "sons": [
            {
                "id": "11",
                "name": "产品经理",
                "parent": "1",
                "path": ",1,11,",
                "grade": "2",
                "order": "10",
                "position": "",
                "function": "",
                "manager": ""
            },
            {
                "id": "12",
                "name": "项目经理",
                "parent": "1",
                "path": ",1,12,",
                "grade": "2",
                "order": "20",
                "position": "",
                "function": "",
                "manager": ""
            }
        ],
        //所有部门列表树
        "tree": [
            {
                "id": "1",
                "name": "经理",
                "parent": "0",
                "path": ",1,",
                "grade": "1",
                "order": "0",
                "position": "",
                "function": "",
                "manager": "",
                "managerName": "",
                "children": [
                    {
                        "id": "11",
                        "name": "产品经理",
                        "parent": "1",
                        "path": ",1,11,",
                        "grade": "2",
                        "order": "10",
                        "position": "",
                        "function": "",
                        "manager": "",
                        "managerName": ""
                    },
                    {
                        "id": "12",
                        "name": "项目经理",
                        "parent": "1",
                        "path": ",1,12,",
                        "grade": "2",
                        "order": "20",
                        "position": "",
                        "function": "",
                        "manager": "",
                        "managerName": ""
                    }
                ],
                "actions": {
                    "delete": false
                }
            },
            {
                "id": "2",
                "name": "开发",
                "parent": "0",
                "path": ",2,",
                "grade": "1",
                "order": "1",
                "position": "",
                "function": "",
                "manager": "",
                "managerName": ""
            },
            {
                "id": "3",
                "name": "测试",
                "parent": "0",
                "path": ",3,",
                "grade": "1",
                "order": "2",
                "position": "",
                "function": "",
                "manager": "",
                "managerName": ""
            },
            {
                "id": "4",
                "name": "市场",
                "parent": "0",
                "path": ",4,",
                "grade": "1",
                "order": "3",
                "position": "",
                "function": "",
                "manager": "",
                "managerName": ""
            },
            {
                "id": "8",
                "name": "客户",
                "parent": "0",
                "path": ",8,",
                "grade": "1",
                "order": "13",
                "position": "",
                "function": "",
                "manager": "",
                "managerName": ""
            }
        ]
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
