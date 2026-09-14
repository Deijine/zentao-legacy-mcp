# 修改项目

PUT/projects/:projectID

##  修改项目 

### 请求URL
https://xxx.com/api.php/v2/projects/:projectID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  name  string  是  项目名称 
|  model  string  是  项目管理方式(scrum 敏捷 | waterfall 瀑布 | kanban 看板 | agileplus 融合敏捷 | waterfallplus 融合瀑布) 
|  begin  date  是  开始日期 
|  end  date  是  结束日期 
|  products  array  否  关联产品 
|  parent  int  否  所属项目集 
|  workflowGroup  int  是  项目流程，付费版功能，开源版可以不填 
|  PM  string  否  项目负责人

### 请求示例

```
{
    "name": "智能设备研发",
    "model": "scrum",
    "begin": "2025-01-01",
    "end": "2026-10-01",
    "products": [
        1
    ],
    "parent": 1,
    "workflowGroup": 13,
    "PM": "projectManager"
}
```

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败)

### 响应示例

```
{
    "status": "success"
}
```
