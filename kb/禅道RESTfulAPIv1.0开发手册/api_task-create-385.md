# 完成单个任务

|  方法说明 
请求此方法，用于确认某一个任务完成，可指派完成任务的用户、消耗时间等信息。
|  使用示例

```
public function addTaskFinish()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao = new \zentao();
    $params = array(
        'taskID'          => 16,
        'currentConsumed' => 1,
        'consumed'        => 19,
        'assignedTo'      => 'lisi',
        'finishedDate'    => '2019-11-12',
        'comment'         => '完成任务描述'
    );    // 请求参数
    $result = $zentao->addTaskFinish($params);
    return $result;
}
```

|  请求方式
 POST 
|  方法名称
 addTaskFinish 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  taskID
 int  必填参数
 任务ID

|  currentConsumed
 int
 必填参数
 本次消耗【小时】

|  consumed
 int  必填参数
 之前消耗【小时,可从 完成单个任务可选信息 方法响应结果 task->consumed 获取】

|  assignedTo
 string
 必填参数
 指派完成用户【示例：admin】

|  finishedDate
 string
 必填参数
 实际完成时间【格式：2019-12-12】

|  comment
 string
 选填参数  完成备注

|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": []
}
```

```
{
    "status": 0,
    "msg": "error",
    "result": []
}
```
