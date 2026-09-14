# 禅道的数据库结构

禅道的数据库命名都比较简明扼要，从字面意思应该都可以猜出来表的用途。如果还不是很清楚的话，可以到每个表对应的模块下面的语言文件里面查找。 
最新版本可以在  禅道 后台---二次开发---数据库 中查看相应的表介绍。 

#### 一、我的地盘相关的表
- zt_todo，待办事宜表。

#### 二、产品相关的表
- zt_product，记录了产品相关的信息。 
- zt_productplan，记录了产品的计划信息。 
- zt_story，是非常重要的一张表，记录了系统中所有的需求记录。 
- zt_storyspec，记录了需求的描述信息。 
- zt_storystage，记录需求的阶段信息。

- zt_release，记录了产品的发布信息。这张表同时也和zt_build互相关联。 
- zt_branch，记录产品的分支和平台信息。

#### 三、项目相关的表
- zt_project，项目表。 
- zt_projectproduct，记录了项目和产品之间的关联关系。 
- zt_projectstory，记录了项目中需要做的需求列表。 
- zt_task，任务表。 
- zt_burn，燃尽图数据表。燃尽图就是根据这张表的数据画出来的。 
- zt_team，记录了项目中的团队成员。 
- zt_build，记录了项目中产品的版本列表。 
- zt_taskestimate，项目任务工时表。

#### 四、测试相关的表
- zt_bug，bug表，也是大家非常熟悉的一张表了。 
- zt_case，用例表。记录了所有的测试用例。 
- zt_casestep，则是记录了用例相关的步骤，包括历史。 
- zt_testtask，测试版本表，记录了历次的测试任务。 
- zt_testrun，则记录了每个测试任务所对应的用例执行情况。 
- zt_testresult，记录了每个用例历次执行的结果。 
- zt_testsuite，测试套件表。

- zt_suitecase，套件用例表。 
- zt_testreport，测试报告表。

#### 五、文档库相关的表
- zt_doclib，记录了自定义文档库列表。 
- zt_doc，则记录了所有的文档。 
- zt_doccontent，文档的内容表。

#### 六、组织管理相关的表
- zt_user，用户表。 
- zt_group，分组表。 
- zt_usergroup，用户和分组之间的对应关系。 
- zt_grouppriv，分组的权限。 
- zt_dept，部门结构表。 
- zt_userquery，用户自定义查询表。 
- zt_usertpl，用户的自定义模板表。 
- zt_usercontact，用户联系人表。 
- zt_company，这张表记录了当前公司的信息，也是顶级的一张表。

#### 七、后台管理相关的表
- zt_action，系统日志表。 
- zt_cron，定时任务表，记录计划任务。

- zt_extension，插件表。 
- zt_history，操作历史表，记录对任何一个对象的所有修改记录，前后值的变化。
- zt_lang，语言定义表。

#### 八、其他模块相关的表
- zt_module，也是非常重要的一张表，它维护了禅道系统中的模块划分数据，比如需求的模块划分。 
- zt_effort，日志表。 
- zt_entry，应用表。 
- zt_log，接口日志表。 
- zt_mailqueue，邮件列队表。 
- zt_module，模块表，记录模块信息。 
- zt_notify，提醒信息表，记录所有的提醒信息。 
- zt_score，积分表，记录积分信息。

- zt_file，附件表。记录了所有的附件。

- zt_block，区块表，记录我的地盘首页，产品主页，项目主页，测试主页的区块信息。 
- zt_config，系统配置表，记录所有的基本配置信息。 
- zt_webhook，记录webhook信息。 
- zt_webhookdatas，记录webhook的数据表。
