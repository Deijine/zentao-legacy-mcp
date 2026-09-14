# 添加单个任务

|  方法说明 
请求此方法，用于新增一个任务，新增任务的同时可以绑定所属项目、指派给某用户、设定优先级等相关信息。
|  使用示例

```
public function addTask()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao = new \zentao();
    $params = array(
        'project'          => 1,
        'type'             => 'ui',
        'module'           => 0,
        'assignedTo[]'     => 'lisi',
        'testAssignedTo[]' => 'lisi',
        'color'            => '',
        'name'             => '测试添加任务2',
        'pri'              => 2,
        'estimate'         => 1,
        'desc'             => '测试添加任务描述测试添加任务描述',
        'estStarted'       => '2019-11-11',
        'deadline'         => '2019-11-12',
        'mailto[1]'        => 'lisi'
    );    // 请求参数
    $result = $zentao->addTask($params);
    return $result;
}
```

|  请求方式
 POST 
|  方法名称

addTask 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  project
 int  必填参数 所属项目ID

|  type
 string
 必填参数 任务类型【design设计|devel开发|test测试|study研究|discuss讨论|ui界面|affair事务|misc其他】

|  module
 int  选填参数
 所属模块ID

|  color
 string
 选填参数
 任务颜色【示例：#ff4e3e】

|  name
 string
 必填参数 任务名称

|  pri
 int  选填参数
 优先级【分为 1、2、3、4级】

|  estimate
 int  选填参数
 预计时间【小时】

|  desc
 string
 选填参数
 任务描述

|  estStarted
 string
 选填参数
 日程规划开始【格式：2019-11-20】

|  deadline
 string
 选填参数
 日程规划结束【格式：2019-11-28】

|  assignedTo
 array
 选填参数
 指派用户，示例：'assignedTo' => array('zhangsan') 
|  mailto
 array  选填参数
 抄送用户，示例：'mailto' => array('lisi', 'niuqi', 'zhangsan'), 代表同时抄送给 3 个用户。
|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": "保存成功"
}
```

```
{
    "status": 0,
    "msg": "error",
    "result": {
        "name": [
            "『任务名称』不能为空。"
        ]
    }
}
```
