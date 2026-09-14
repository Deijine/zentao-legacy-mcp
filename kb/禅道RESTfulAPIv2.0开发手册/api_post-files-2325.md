# 上传附件，使用表单方式提交

POST  /files 

##  上传附件，使用表单方式提交 
 版本：v22.0及以上 

###  请求URL 
https://xxx.com/api.php/v2/files

###  请求头 
|   名称   类型   必填   描述 
|   token   string   是   访问凭证Token 

###  请求体 
|   名称   类型   必填   描述 
|   file   file   是   文件地址，比如 --form 'file=@"D:\test.txt"' 
|   objectType   string   是   关联对象类型(bug 缺陷 | story 需求 | task 任务 | testcase 用例) 
|   objectID   int   是   关联对象ID 

###  请求示例 

```
{
    "file": "D:\\test.txt",
    "objectType": "story",
    "objectID": 1
}
```

###  请求响应 
|   名称   类型   描述 
|   status   string   状态(success 成功 | fail 失败) 
|   id   int   文件ID 
|   url   string   文件访问地址 

###  响应示例 

```
{
    "status": "success"
}
```
