# 修改测试用例

PUT  /testcases/:testcasID 

##  修改测试用例 

###  请求URL 
https://xxx.com/api.php/v2/testcases/:testcasID

###  请求头 
|   名称   类型   必填   描述 
|   token   string   是   访问凭证Token 

###  请求体 
|   名称   类型   必填   描述 
|   title   string   是   用例标题 
|   module   int   否   所属模块 
|   story   int   否   相关需求 
|   pri   int   否   优先级 
|   type   string   否   用例类型(unit 单元测试 | interface 接口测试 | feature 功能测试 | install 安装部署 | config 配置相关 | performance 性能测试 | security 安全相关 | other 其他) 
|   precondition   string   否   前置条件 
|   steps   array   否   用例步骤 
|   expects   array   否   用例步骤期望 
|   stepType   array   否   用例步骤类型(step 步骤 | group 父级步骤) 

###  请求示例 

```
{
    "title": "测试光敏模块显示是否正常",
    "moudule": 0,
    "story": 0,
    "pri": 3,
    "type": "feature",
    "steps": [
        "步骤1",
        "步骤2"
    ],
    "expects": [
        "期望1",
        "期望2"
    ],
    "stepType": [
        "step",
        "step"
    ]
}
```

###  请求响应 
|   名称   类型   描述 
|   status   string   状态(success 成功 | fail 失败) 

###  响应示例 

```
{
    "status": "success"
}
```
