# 编辑附件，修改附件的名称

PUT  /files/:fileID 

##  编辑附件，修改附件的名称 

###  请求URL 
https://xxx.com/api.php/v2/files/1

###  请求头 
|   名称   类型   必填   描述 
|   token   string   是   访问凭证Token 

###  请求体 
|   名称   类型   必填   描述 
|   fileName   string   是   附件名称 

###  请求示例 

```
{
    "fileName": "test2.txt"
}
```

###  请求响应 
|   名称   类型   描述 
|   status   String   状态(success 成功 | fail 失败) 

###  响应示例 

```
{
    "status": "success"
}
```
