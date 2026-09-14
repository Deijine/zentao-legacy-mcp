# 修改反馈

PUT/feedbacks/:feedbackID

##  修改反馈 

### 请求URL
https://xxx.com/api.php/v2/feedbacks/:feedbackID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  product  int  是  所属产品 
|  module  int  否  所属模块 
|  title  string  是  标题 
|  type  string  否  类型(story 需求 | task 任务 | bug Bug | todo 待办 | advice 建议 | issue 问题 | risk 风险 | opportunity 机会) 
|  desc  string  否  描述 
|  feedbackBy  string  否  反馈者 
|  source  string  否  来源

### 请求示例

```
{
    "product": 1,
    "module": 1,
    "title": "光敏元件灵敏度不够",
    "type": "story",
    "desc": "监测灵敏度不够",
    "feedbackBy": "客户对接人",
    "source": "XX技术有限公司"
}
```

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  id  int  ID

### 响应示例

```
{
    "status": "success",
    "id": "1"
}
```
