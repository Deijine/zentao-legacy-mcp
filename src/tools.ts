// ZenTao Legacy MCP - tool definitions (name, description, input schema).
// These map to the legacy session-based view/write API for Product / Story / Bug.

export interface ToolSchema {
  type: string | string[];
  enum?: string[] | number[];
  default?: unknown;
  description?: string;
  minimum?: number;
  maximum?: number;
  [k: string]: unknown;
}

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, ToolSchema>;
    required?: string[];
  };
}

export const TOOLS: ToolDef[] = [
  // ---------- AUTH / META ----------
  {
    name: 'zentao_whoami',
    description: '登录/验证会话（whoami）。返回当前账号、角色、会话健康状态。首次调用确认连接。',
    inputSchema: {
      type: 'object',
      properties: {
        forceRelogin: { type: 'boolean', description: 'If true, drop the current session and log in again. Defaults to false.' }
      }
    }
  },
  {
    name: 'zentao_context',
    description: '获取账号上下文（部署画像：我的产品/项目列表 + 模块/版本计数 + 功能点状态）。返回推荐值供参考，但必须告知用户确认后才能用于其他工具。每会话调用一次。首次调用会触发部署自动发现（抓取产品/项目/模块/版本，缓存到本地，之后秒回）。',
    inputSchema: {
      type: 'object',
      properties: {
        refresh: { type: 'boolean', description: '强制重新发现（忽略本地缓存，重新抓取部署结构）。默认 false。' }
      }
    }
  },
  {
    name: 'zentao_profile',
    description: '部署画像：当前禅道实例上有哪些产品（含每产品的模块树/迭代/版本）、全局项目、功能点状态（模块直连路由/用例功能点）、用户已保存的查询。只读+本地缓存，首次调用触发自动发现。可传 productID 只看某个产品。refresh=true 强制重新发现。',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Only return this product (with its full module tree / executions / builds).' },
        refresh: { type: 'boolean', description: 'Force live re-discovery (ignore the local cache). Defaults to false.' }
      }
    }
  },
  {
    name: 'zentao_html_help',
    description: '富文本 HTML 标签参考（15种支持标签+示例+注意事项）。纯本地，不访问云端。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'zentao_tool_guide',
    description: '工具使用指南（按场景：建需求/提Bug/任务全流程/需求转Bug/清理/批量操作）。纯本地，不访问云端。',
    inputSchema: {
      type: 'object',
      properties: {
        scenario: { type: 'string', enum: ['create_story', 'create_bug', 'task_lifecycle', 'story_to_bug', 'cleanup', 'batch_ops'], description: 'Scenario key for detailed steps. Omit to list all scenarios.' }
      }
    }
  },
  {
    name: 'zentao_multi_op',
    description: '多重操作（multi-op）：AI 识别用户语义后，将跨实体类型的复合指令拆解为步骤序列，一次调用按序执行。与 batch（同实体同操作）不同，multi_op 支持不同工具、不同实体混用。例："激活需求9344，解决并关闭Bug 20494，完成任务2201" → 3个步骤。',
    inputSchema: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          description: '按序执行的步骤列表。每步指定 tool（工具名，可省略 zentao_ 前缀）和 args（该工具的参数）。',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string', description: '工具名（如 story_advance, bug_resolve, task_finish）。可省略 zentao_ 前缀。' },
              args: { type: 'object', description: '该工具的参数（与单独调用时一致）。' }
            },
            required: ['tool', 'args']
          }
        },
        stopOnError: { type: 'boolean', description: '默认 true：某步失败则停止后续步骤。设 false 则继续执行剩余步骤。' }
      },
      required: ['steps']
    }
  },
  {
    name: 'zentao_relations',
    description: '实体关联图：传入 story/bug/task 的 ID，返回它关联的所有其他实体（需求→Bug/任务/计划/子需求，Bug→需求/任务/版本，任务→需求/子任务/Bug）。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['story', 'bug', 'task'], description: '实体类型。' },
        id: { type: 'integer', description: '实体 ID。' }
      },
      required: ['entity', 'id']
    }
  },
  {
    name: 'zentao_validate_args',
    description: '参数预检（纯本地）：传入任意工具名+参数，返回 schema 校验结果（缺失必填字段、类型/枚举错误）。调用前用此工具预检，避免无效云端请求。',
    inputSchema: {
      type: 'object',
      properties: {
        tool: { type: 'string', description: '工具名（如 story_create, bug_resolve）。可省略 zentao_ 前缀。' },
        args: { type: 'object', description: '该工具的参数（与单独调用时一致）。' }
      },
      required: ['tool', 'args']
    }
  },
  {
    name: 'zentao_status_enum',
    description: '状态枚举参考（纯本地）：返回所有实体类型的 status/stage/severity 合法值 + 状态流转路径。agent 不用猜传什么值。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['story', 'bug', 'task', 'product'], description: '实体类型。省略则返回全部。' }
      }
    }
  },
  {
    name: 'zentao_dry_run',
    description: '写操作预演：传入任意写工具+参数，不执行，返回当前状态 diff（当前值→预期值）+ 风险等级 + 是否可逆。调用前用此工具预览影响。',
    inputSchema: {
      type: 'object',
      properties: {
        tool: { type: 'string', description: '写工具名（如 story_update, bug_resolve）。可省略 zentao_ 前缀。' },
        args: { type: 'object', description: '该工具的参数（与单独调用时一致）。' }
      },
      required: ['tool', 'args']
    }
  },
  {
    name: 'zentao_filter',
    description: '条件查询首选（客户端全量扫描，结果完整，任何部署可用）：按标题包含 titleContains/日期范围 dateFrom+dateTo/优先级范围/多值指派/状态/keywords前缀 过滤需求/Bug/任务列表，返回项含可点击 url。凡是 标题含X且创建日期晚于Y 这类条件查询用本工具（或 bug_search/story_search 的 conditions 参数走服务端），不要用 *_list + limit 自行截取。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['story', 'bug', 'task'], description: '实体类型。' },
        productID: { type: 'integer', description: '产品 ID（story/bug，可选；不传则扫描全部产品）。' },
        projectID: { type: 'integer', description: '项目 ID（task，可选；不传则扫描全部项目）。' },
        filters: {
          type: 'object',
          description: '过滤条件（全部可选）。',
          properties: {
            assignedTo: { type: ['string', 'array'], items: { type: 'string' }, description: '指派人账号，支持单个账号或账号数组（多值 OR）。' },
            priMin: { type: 'integer', description: '最低优先级（1=紧急，0=未设置）。' },
            priMax: { type: 'integer', description: '最高优先级（4=低）。' },
            status: { type: 'string', description: '状态过滤。' },
            titleContains: { type: 'string', description: '标题包含关键词。' },
            keywordsPrefix: { type: 'string', description: 'keywords 前缀。' },
            dateFrom: { type: 'string', description: '创建日期起始。' },
            dateTo: { type: 'string', description: '创建日期截止。' }
          }
        },
        limit: { type: 'integer', description: '返回条数上限，默认 50。' }
      },
      required: ['entity']
    }
  },
  {
    name: 'zentao_stats',
    description: '统计汇总：按状态/严重程度/指派人/优先级 分组计数。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['story', 'bug', 'task'], description: '实体类型。' },
        productID: { type: 'integer', description: '产品 ID（story/bug，可选；不传则统计全部产品）。' },
        projectID: { type: 'integer', description: '项目 ID（task，可选；不传则统计全部项目）。' },
        groupBy: { type: 'string', enum: ['status', 'severity', 'assignedTo', 'pri'], description: '分组维度，默认 status。' }
      },
      required: ['entity']
    }
  },
  {
    name: 'zentao_template',
    description: '创建模板（纯本地）：Bug/需求/任务的标准模板 + 字段填写指南。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['bug', 'story', 'task'], description: '实体类型。' }
      }
    }
  },
  {
    name: 'zentao_workflow',
    description: '工作流检查：检查实体能否执行某操作（前置条件）。不传 action 返回所有操作。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['story', 'bug', 'task'], description: '实体类型。' },
        id: { type: 'integer', description: '实体 ID。' },
        action: { type: 'string', description: '要检查的操作。省略则返回所有。' }
      },
      required: ['entity', 'id']
    }
  },
  {
    name: 'zentao_batch_dry_run',
    description: '批量预演：传入多个 ID + 操作，返回每个的当前状态 + 能否执行。不执行写操作。',
    inputSchema: {
      type: 'object',
      properties: {
        tool: { type: 'string', description: '写工具名。' },
        ids: { type: 'array', items: { type: 'integer' }, description: '实体 ID 数组。' },
        args: { type: 'object', description: '参数（可选）。' }
      },
      required: ['tool', 'ids']
    }
  },

  {
    name: 'zentao_field_guide',
    description: '字段参考（纯本地）：返回指定实体的完整字段说明（含义/类型/可选值/必填）+ 各写工具能改什么 + 特殊注意事项。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['story', 'bug', 'task'], description: '实体类型。' },
        tool: { type: 'string', description: '工具名（可选，聚焦到该工具的字段）。' }
      }
    }
  },
  {
    name: 'zentao_my_workbench',
    description: '我的工作台：所有未关闭且分配给我的需求/Bug/任务（未关闭=需要处理）。传 productID/projectID 缩小范围，不加时间过滤。返回项含可点击 url。',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: '只看指定产品（缩小范围）。' },
        projectID: { type: 'integer', description: '只看指定项目（缩小范围）。' }
      }
    }
  },
  {
    name: 'zentao_my_dashboard',
    description: '我的地盘(/my/)数据汇总：一次调用拉取「关于我」的全部看板数据，适合外部 APP 对接——指派给我的需求/未关闭Bug（跨所有未关闭产品，unclosed=status!=closed）、我的任务（全部状态，open 计数标出）、我参与的未完项目、我参与的未关闭产品、我的动态流。所有条目带可点击 url。只读；约 30-60 秒（逐产品扫描）。只要未关闭精简视图用 zentao_my_workbench。',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'zentao_export',
    description: '数据导出：将需求/Bug/任务导出为 CSV 或 JSON 字符串，支持 filters 过滤（与 zentao_filter 相同条件），每行附可点击 url。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['story', 'bug', 'task'], description: '实体类型。' },
        productID: { type: 'integer', description: '产品 ID（story/bug，可选；不传则导出全部产品）。' },
        projectID: { type: 'integer', description: '项目 ID（task，可选；不传则导出全部项目）。' },
        filters: {
          type: 'object',
          description: '过滤条件（全部可选，同 zentao_filter）。',
          properties: {
            assignedTo: { type: ['string', 'array'], items: { type: 'string' }, description: '指派人账号，支持多值数组。' },
            priMin: { type: 'integer', description: '最低优先级（1=紧急，0=未设置）。' },
            priMax: { type: 'integer', description: '最高优先级（4=低）。' },
            status: { type: 'string', description: '状态过滤。' },
            titleContains: { type: 'string', description: '标题包含关键词。' },
            keywordsPrefix: { type: 'string', description: 'keywords 前缀。' },
            dateFrom: { type: 'string', description: '创建日期起始。' },
            dateTo: { type: 'string', description: '创建日期截止。' }
          }
        },
        format: { type: 'string', enum: ['csv', 'json'], description: '导出格式，默认 json。' }
      },
      required: ['entity']
    }
  },
  {
    name: 'zentao_story_advance',
    description: '需求状态一键流转：自动检测当前状态→最短路径到目标状态。draft→active 自动走评审+变更。',
    inputSchema: {
      type: 'object',
      properties: {
        storyID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Story ID.' },
        target: { type: 'string', enum: ['active', 'closed'], description: 'Target status.' },
        closedReason: { type: 'string', description: 'Only for target=closed: done/duplicate/postponed/willnotdo/cancel/bydesign.' }
      },
      required: ['storyID', 'target']
    }
  },
  {
    name: 'zentao_bulk_close',
    description: '批量关闭需求/Bug（一次调用关多个）。Bug 自动先解决再关闭。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['story', 'bug'], description: 'Entity type.' },
        ids: { type: 'array', items: { type: 'integer' }, description: 'Array of entity IDs to close.' },
        closedReason: { type: 'string', description: 'For stories: done/duplicate/postponed/willnotdo/cancel/bydesign. For bugs: auto-resolves with bydesign then closes.' }
      },
      required: ['entity', 'ids']
    }
  },
  {
    name: 'zentao_bulk_assign',
    description: '批量指派需求/Bug/任务给指定账号（一次调用指派多个）。',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['story', 'bug', 'task'], description: 'Entity type.' },
        ids: { type: 'array', items: { type: 'integer' }, description: 'Array of entity IDs.' },
        assignedTo: { type: 'string', description: 'Target account.' }
      },
      required: ['entity', 'ids', 'assignedTo']
    }
  },
  {
    name: 'zentao_cleanup_mcp',
    description: '扫描并批量软删所有 MCP-AUTO 标记的测试实体（需求/Bug/任务）。dry_run 默认列出；设 false 执行删除。用例仅列出（无删除权限）。',
    inputSchema: {
      type: 'object',
      properties: {
        dry_run: { type: 'boolean', description: 'Default true. Set false to execute deletion.' },
        types: { type: 'array', items: { type: 'string', enum: ['story', 'bug', 'task', 'case'] }, description: 'Optional: limit to specific types. Default: all.' }
      }
    }
  },

  // ---------- PRODUCT ----------
  {
    name: 'zentao_product_list',
    description: 'List products. Filter by status: open/normal (未关闭), closed (已关闭), or all. Returns id, name, code, PO/QD/RD owners, status, description.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open', description: 'Filter: open (未关闭/normal), closed, or all.' }
      }
    }
  },
  {
    name: 'zentao_product_get',
    description: 'Get one product detail by ID: name, code, description, owners (PO/QD/RD), status, plans, module tree.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' }
      },
      required: ['productID']
    }
  },
  {
    name: 'zentao_product_create',
    description: 'Create a new product. Requires name and code. Optional: PO (产品负责人 account), desc (描述), type (normal/branch/platform).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Product name (名称).' },
        code: { type: 'string', description: 'Product code (代码), e.g. "cp21".' },
        desc: { type: 'string', description: 'Description (描述), optional.' },
        PO: { type: 'string', description: 'Product owner account (产品负责人), optional.' },
        type: { type: 'string', enum: ['normal', 'branch', 'platform'], default: 'normal', description: 'Product type.' }
      },
      required: ['name', 'code']
    }
  },
  {
    name: 'zentao_product_update',
    description: 'Edit a product (编辑产品). KB [api_edit-product]. Can update name, code, type, status, desc, PO.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' },
        name: { type: 'string', description: 'New name (optional).' },
        code: { type: 'string', description: 'New code (optional).' },
        type: { type: 'string', enum: ['normal', 'branch', 'platform'], description: 'Product type (optional).' },
        status: { type: 'string', enum: ['normal', 'closed'], description: 'Product status (optional).' },
        desc: { type: 'string', description: 'Description (optional).' },
        PO: { type: 'string', description: 'Product owner account (optional).' }
      },
      required: ['productID']
    }
  },

  // ---------- STORY ----------
  {
    name: 'zentao_story_list',
    description: 'List stories (需求). With productID: SERVER-SIDE product scope via product-browse (ALL product stories, full pagination; moduleID scopes to one module server-side; status presets apply server-side). Without productID: the account\'s own stories (my-story-browse) filtered client-side. Returns id, title, status, stage, pri, estimate, assignee, product. Every item includes a clickable url.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. With it: server-side product scope (all stories of the product). Without: the account\'s own visible stories.' },
        moduleID: { type: 'integer', description: 'Server-side module scope (product-browse byModule). Requires productID. Cannot be combined with a status preset (module scope wins; stage values still refine client-side).' },
        status: { type: 'string', enum: ['all', 'active', 'draft', 'changed', 'closed', 'unclosed', 'openedbyme', 'assignedtome', 'reviewedbyme', 'closedbyme', 'willclose', 'feedback', 'wait', 'planned', 'projected', 'developing', 'developed', 'testing', 'tested', 'verified', 'released'], default: 'all', description: 'With productID (server-side presets, official story tabs): all | active | draft | changed | closed | unclosed(未关闭) | openedbyme(我创建) | assignedtome(指派给我) | reviewedbyme(我评审) | closedbyme(我关闭) | willclose(待关闭) | feedback(反馈). Stage values (wait/planned/.../released) refine client-side. Without productID: status (draft/active/closed/changed) or stage filter applied client-side. [KB: api_695.md]' },
        branch: { type: 'integer', default: 0, description: 'Branch ID (0 = main).' },
        limit: { type: 'integer', default: 20, description: 'Max stories to return (1-200). The total count is always the full filtered count; raise limit to see more.' }
      }
    }
  },
  {
    name: 'zentao_story_get',
    description: 'Get one story (需求) detail by ID, including full review record (评审记录) and change history (变更历史).',
    inputSchema: {
      type: 'object',
      properties: {
        storyID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Story ID.' }
      },
      required: ['storyID']
    }
  },
  {
    name: 'zentao_story_create',
    description: 'Create a new story (需求) AND auto-review it to ACTIVE in one call (default). Requires productID and title. Attachments are uploaded at create time (BEFORE review — the required order). Set autoReview: false to keep the story in draft for human review. Creates a REAL story by default — no machine marker ([MCP] title prefix / MCP-AUTO keyword / color) is written. Machine markers are written ONLY when the server runs with ZENTAO_MARKERS=1 (development environment). Returns marker info + reviewed flag in result.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' },
        title: { type: 'string', description: 'Story title (标题).' },
        spec: { type: 'string', description: 'Story spec/description HTML (rich text, optional). Supports <b>, <i>, <ul>, <ol>, <p>, <br>, <a>, <img>, <table> etc.' + ' <img> with a LOCAL file path src (e.g. /Users/.../shot.png, ~/x.png, file://) or data: URI is auto-uploaded to the ZenTao file store and replaced with a hosted URL (all other formatting preserved); remote URLs pass through unchanged.' },
        verify: { type: 'string', description: 'Acceptance criteria HTML (rich text, optional). Same format as spec (local images auto-uploaded).' },
        estimate: { type: 'number', description: 'Estimated effort in hours (预估工时), optional.' },
        pri: { type: 'integer', default: 3, description: 'Priority 1-4 (1 highest).' },
        moduleID: { type: 'integer', description: 'Module ID the story belongs to (optional; 0 = no module).' },
        plan: { type: 'integer', description: 'Product plan (迭代) ID to link at creation (optional; more reliable than linking after create). Use zentao_productplan_list to get IDs.' },
        source: { type: 'string', description: 'Story source (optional). Common values: customer 客户 / user 用户 / po 产品经理 / market 市场 / devops / api / conclusion (default).' },
        sourceNote: { type: 'string', description: 'Source note (来源备注, optional, e.g. a tracking-sheet date reference).' },
        assignedTo: { type: 'string', description: 'Assignee account to set at creation (optional).' },
        keywords: { type: 'string', description: 'Keywords (optional; batch labeling, e.g. 【用户】). Merged with any MCP marker keyword in dev mode.' },
        attachments: { type: 'array', items: { type: 'string' }, description: 'Optional local file paths to attach (禅道附件, ≤50M each, e.g. XLS/PDF/logs/screenshots). Uploaded at create time, i.e. BEFORE the automatic review — the correct order.' },
        autoReview: { type: 'boolean', default: true, description: 'Automatically review-pass the new story so it becomes ACTIVE right after creation (default true). Set false to leave it in DRAFT for a human reviewer.' },
        reviewComment: { type: 'string', description: 'Comment written on the automatic review (optional, only used when autoReview is true).' }
      },
      required: ['productID', 'title']
    }
  },
  {
    name: 'zentao_story_update',
    description: 'Update a story basic fields (title, priority, assignee, stage). Note: spec/verify (需求描述/验收标准) CANNOT be changed here — use zentao_story_change (需求变更) for that.',
    inputSchema: {
      type: 'object',
      properties: {
        storyID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Story ID.' },
        title: { type: 'string', description: 'New title (optional).' },
        priority: { type: 'integer', description: 'Priority 1-4 (optional).' },
        assignedTo: { type: 'string', description: 'Assignee account (optional).' },
        stage: { type: 'string', description: 'Stage (optional).' }
      },
      required: ['storyID']
    }
  },
  {
    name: 'zentao_story_close',
    description: 'Close a story (关闭需求). KB [api_close-story]: closedReason is required (done/duplicate/postponed/willnotdo/cancel/bydesign). Appends a "via" trace note to the comment only when the server runs with ZENTAO_MARKERS=1 (development environment); real-data mode writes a plain comment.',
    inputSchema: {
      type: 'object',
      properties: {
        storyID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Story ID to close.' },
        closedReason: { type: 'string', enum: ['done', 'duplicate', 'postponed', 'willnotdo', 'cancel', 'bydesign'], description: 'Close reason. done=已完成, duplicate=重复, postponed=延期, willnotdo=不做, cancel=已取消, bydesign=设计如此.' },
        comment: { type: 'string', description: 'Optional note/remark.' },
        duplicateStoryID: { type: 'integer', description: 'If closedReason=duplicate, the ID of the duplicate story.' }
      },
      required: ['storyID', 'closedReason']
    }
  },
  {
    name: 'zentao_story_review',
    description: 'Review a story (需求评审). KB [api_edit-story-fields]: result=pass (通过) or fail (不通过). Can set assignedTo, reviewedBy, pri, comment. Appends a "via" trace note to the comment only when the server runs with ZENTAO_MARKERS=1 (development environment).',
    inputSchema: {
      type: 'object',
      properties: {
        storyID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Story ID to review.' },
        result: { type: 'string', enum: ['pass', 'fail'], description: 'Review result. pass=评审通过, fail=评审不通过.' },
        comment: { type: 'string', description: 'Review comment (optional).' },
        assignedTo: { type: 'string', description: 'Assign to this account after review (optional).' },
        reviewedBy: { type: 'array', items: { type: 'string' }, description: 'Reviewer account(s) (optional, defaults to current user).' },
        pri: { type: 'integer', minimum: 1, maximum: 4, description: 'Adjusted priority (optional).' }
      },
      required: ['storyID', 'result']
    }
  },
  {
    name: 'zentao_story_change',
    description: 'Change/modify a story (需求变更). KB [api_change-story]: update title/spec/verify. Appends a "via" trace note to the comment only when the server runs with ZENTAO_MARKERS=1 (development environment).',
    inputSchema: {
      type: 'object',
      properties: {
        storyID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Story ID to change.' },
        title: { type: 'string', description: 'New title (optional).' },
        spec: { type: 'string', description: 'New spec/description (optional). Rich text HTML. <img> local file path / data URI auto-uploaded to the ZenTao file store, replaced with hosted URL; other formatting preserved.' },
        verify: { type: 'string', description: 'New verification criteria (optional). Rich text HTML. <img> local file path / data URI auto-uploaded to the ZenTao file store, replaced with hosted URL; other formatting preserved.' },
        comment: { type: 'string', description: 'Change reason/comment (optional).' },
        assignedTo: { type: 'string', description: 'Re-assign to this account (optional).' },
        attachments: { type: 'array', items: { type: 'string' }, description: 'Optional local file paths to attach (禅道附件, ≤50M each, e.g. XLS/PDF/logs/screenshots). Server associates them automatically.' },
      },
      required: ['storyID']
    }
  },

  // ---------- BUG ----------
  {
    name: 'zentao_bug_list',
    description: 'List bugs for a product. Filter by module, severity, current assignee (assignedTo), or status (unclosed/closed/all). Returns id, title, severity, pri, status, module, assignedTo, openedBy, date. Every item includes a clickable url.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' },
        moduleID: { type: 'integer', description: 'Filter by module ID (optional).' },
        severity: { type: 'integer', minimum: 1, maximum: 4, description: 'Filter by severity 1-4 (optional).' },
        assignedTo: { type: 'string', description: 'Filter by current assignee account (optional).' },
        status: { type: 'string', enum: ['unclosed', 'all', 'openedbyme', 'assigntome', 'resolvedbyme', 'toclosed', 'unresolved', 'unconfirmed', 'assigntonull', 'longlifebugs', 'postponedbugs', 'overduebugs', 'needconfirm', 'feedback', 'closed', 'resolved', 'open'], default: 'unclosed', description: 'Server-side browseType tabs (verified live on this deployment, 2026-09-13): unclosed(未关闭) | all(全部) | openedbyme(由我创建) | assigntome(指派给我) | resolvedbyme(由我解决) | toclosed(待关闭) | unresolved(未解决) | unconfirmed(未确认) | assigntonull(未指派) | longlifebugs(久未处理) | postponedbugs(被延期) | overduebugs(过期Bug) | needconfirm(需求变动) | feedback(来自反馈). Legacy status values closed/resolved/open are NOT tabs here: they fetch all bugs and filter client-side by the status field (slower). 注意：这是状态类过滤；标题/日期条件用 zentao_bug_search conditions 或 zentao_filter.' },
        branch: { type: 'integer', default: 0, description: 'Branch ID (0 = main).' },
        limit: { type: 'integer', default: 20, description: 'Max bugs to return (1-200). The total count is always the full filtered count; raise limit to see more.' }
      },
      required: ['productID']
    }
  },
  {
    name: 'zentao_bug_saved_queries',
    description: 'List the account\'s saved bug search queries (已保存的查询条件) with their queryID and title. Use this to find a queryID, then pass it to zentao_bug_search to run that exact server-side search (far more efficient than full-scan filtering).',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID for context. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' }
      }
    }
  },
  {
    name: 'zentao_bug_search',
    description: 'Search bugs. Two server-side modes: (1) conditions — ad-hoc conditional search (临时条件搜索: a temporary server query is created, executed, then auto-cleaned; needs the search feature point, else feature_not_enabled with alternatives); (2) queryID — run a saved query (server-side, from zentao_bug_saved_queries). The response carries mode (server-adhoc / server). For client-side conditional filtering that works on every deployment, use zentao_filter. Use when the user asks for conditions like 标题含X且创建日期晚于Y, or references a named saved query.',
    inputSchema: {
      type: 'object',
      properties: {
        queryID: { type: 'integer', description: 'Saved query ID (from zentao_bug_saved_queries).' },
        conditions: {
          type: 'array',
          maxItems: 6,
          description: 'Ad-hoc server-side conditions (临时服务端条件搜索: creates a temporary query, runs it, then cleans it up). Takes precedence over queryID. Requires the deployment to have the search feature point enabled (otherwise returns feature_not_enabled with alternatives).',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', description: 'Field key. Bug: title keywords openedBy assignedTo status severity pri type module openedDate openedBuild. Story: title keywords openedBy assignedTo status category pri module openedDate.' },
              operator: { type: 'string', enum: ['=', '!=', '>', '>=', '<', '<=', 'include', 'notinclude', 'between', 'belong'], default: 'include', description: 'Operator. Omit to use the deployment-native default for that field (e.g. title→include, stage/status/pri→=, module→belong, date→=). Select-field values are validated against the deployment option domain (invalid → invalid_value with allowed list). Date range: two conditions openedDate>=start AND openedDate<=end (recommended), or operator=between with value "start,end".' },
              value: { type: 'string', description: 'Condition value (string; pass numbers/dates/IDs as strings). For between: "start,end".' },
              andOr: { type: 'string', enum: ['and', 'or'], default: 'and', description: 'Join with the PREVIOUS condition (2nd condition onwards). The 4th condition\'s andOr joins group 1 and group 2 (form model: 3+3). Default and.' }
            },
            required: ['field', 'value']
          }
        },

        productID: { type: 'integer', default: 20, description: 'Product ID for the browse context. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        severity: { type: 'integer', minimum: 1, maximum: 4, description: 'Extra client-side severity filter (optional).' },
        assignedTo: { type: 'string', description: 'Extra client-side assignee filter (optional).' },
        limit: { type: 'integer', default: 20, description: 'Max bugs to return (1-200). total is always the full count.' }
      },
    }
  },
  {
    name: 'zentao_global_search',
    description: 'Global full-text search (全文检索) across ALL entity types — stories, bugs, tasks, cases, docs, projects, test reports… Server route /search-index (the 全文检索 module). Returns ranked cross-entity results: objectType + objectID + cleaned title/summary + addedDate/editedDate + relevance score + clickable url. Use when the user asks 全局搜索/全文检索/搜一下/哪些需求或Bug提到X. NOTE: the server returns a mixed result set and does NOT filter by type on this route — the type param is applied client-side, and total is the all-types grand total. For single-entity conditional queries (field operators/date ranges/OR) prefer zentao_bug_search / zentao_story_search / zentao_filter.',
    inputSchema: {
      type: 'object',
      properties: {
        words: { type: 'string', description: 'Search keyword(s) (搜索关键词). Full-text matched across entity title/spec/steps/keywords etc.' },
        type: { type: 'string', enum: ['all', 'story', 'bug', 'task', 'case', 'testcase', 'project', 'product', 'doc', 'caselib', 'testreport', 'testtask', 'feedback', 'service'], default: 'all', description: 'Result type filter (client-side; server always returns mixed): all 全部 / story 需求 / bug / task 任务 / case+testcase 用例 / project 项目 / product 产品 / doc 文档 / caselib 用例库 / testreport 测试报告 / testtask 测试单 / feedback 反馈 / service 服务.' },
        limit: { type: 'integer', default: 50, description: 'Max results to return (1-500). Server pages ~100 rows; more pages are fetched as needed (hard cap 10 pages / ~1000 rows scanned).' }
      },
      required: ['words']
    }
  },
  {
    name: 'zentao_bug_get',
    description: 'Get one bug detail by ID, including full history (历史记录), comments, steps, and related story/task.',
    inputSchema: {
      type: 'object',
      properties: {
        bugID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Bug ID.' }
      },
      required: ['bugID']
    }
  },
  {
    name: 'zentao_bug_create',
    description: 'Create a new bug. Requires productID, moduleID, title. Strongly recommended: steps (复现步骤). Optional: severity, pri, type, assignedTo, story, project, keywords. Creates a REAL bug by default — no machine marker ([MCP] title prefix / MCP-AUTO keyword / color) is written. Machine markers are written ONLY when the server runs with ZENTAO_MARKERS=1 (development environment), for test-entity filtering/batch cleanup. Returns marker info (enabled flag) in result.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' },
        moduleID: { type: 'integer', description: 'Module ID (所属模块).' },
        title: { type: 'string', description: 'Bug title.' },
        steps: { type: 'string', description: 'Reproduction steps (复现步骤), strongly recommended. Rich text HTML (see zentao_html_help). <img> local file path / data URI auto-uploaded to the ZenTao file store, replaced with hosted URL; other formatting preserved.' },
        severity: { type: 'integer', default: 3, minimum: 1, maximum: 4, description: 'Severity 1-4.' },
        pri: { type: 'integer', default: 3, minimum: 1, maximum: 4, description: 'Priority 1-4.' },
        type: { type: 'string', default: 'codeerror', description: 'Bug type — must be a value the cloud defines (validated against the live form; default codeerror).' },
        openedBuild: { type: 'string', description: '影响版本 — build id OR name (e.g. "97" or "staging" or "主干"). Defaults to the product\'s first build, validated against cloud config.' },
        assignedTo: { type: 'string', description: 'Assign to account (optional).' },
        story: { type: 'integer', description: 'Related story ID (optional).' },
        project: { type: 'integer', description: 'Project ID (optional).' },
        attachments: { type: 'array', items: { type: 'string' }, description: 'Optional local file paths to attach (禅道附件, ≤50M each, e.g. XLS/PDF/logs/screenshots). Server associates them automatically.' },
        keywords: { type: 'string', description: 'Existing keywords to preserve; the MCP marker is appended automatically. (optional)' }
      },
      required: ['productID', 'moduleID', 'title']
    }
  },
  {
    name: 'zentao_bug_update',
    description: 'Update a bug (修改Bug). KB [api_edit-bug]. Fields preserved from current bug; only provided fields change.',
    inputSchema: {
      type: 'object',
      properties: {
        bugID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Bug ID.' },
        title: { type: 'string', description: 'New title (optional).' },
        moduleID: { type: 'integer', description: 'Module ID (optional).' },
        storyID: { type: 'integer', description: 'Linked story (optional).' },
        taskID: { type: 'integer', description: 'Linked task (optional).' },
        assignedTo: { type: 'string', description: 'Assignee account (optional).' },
        type: { type: 'string', description: 'Bug type (optional).' },
        severity: { type: 'integer', description: 'Severity 1-4 (optional).' },
        pri: { type: 'integer', description: '优先级：0=未设置 1=紧急 2=高 3=中 4=低（可选）。' },
        steps: { type: 'string', description: 'Repro steps HTML (rich text, optional). Supports <b>, <i>, <ol>, <ul>, <br>, <code>, <img> etc. <img> local file path / data URI auto-uploaded to the ZenTao file store, replaced with hosted URL; other formatting preserved.' },
        deadline: { type: 'string', description: 'Deadline YYYY-MM-DD (optional).' },
        comment: { type: 'string', description: 'Edit comment (optional).' },
        attachments: { type: 'array', items: { type: 'string' }, description: 'Optional local file paths to attach (禅道附件, ≤50M each, e.g. XLS/PDF/logs/screenshots). Server associates them automatically.' },
      },
      required: ['bugID']
    }
  },
  {
    name: 'zentao_bug_resolve',
    description: 'Resolve a bug (解决). resolution [KB: api_1181.md]: fixed (已修复) | bydesign (设计如此) | duplicate (重复bug) | external (外部原因) | notrepro (无法重现) | postponed (延期处理) | willnotfix (不予解决) | tostory (转需求). Sets status to resolved.',
    inputSchema: {
      type: 'object',
      properties: {
        bugID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Bug ID.' },
        resolution: { type: 'string', enum: ['fixed', 'bydesign', 'duplicate', 'external', 'notrepro', 'postponed', 'willnotfix', 'tostory'], description: 'Resolution (解决方案) [KB: api_1181.md]. tostory requires no extra field; duplicate requires duplicateBug.' },
        comment: { type: 'string', description: 'Resolution comment (optional).' }
      },
      required: ['bugID', 'resolution']
    }
  },
  {
    name: 'zentao_bug_close',
    description: 'Close a bug (关闭). Usually after it is resolved. Sets status to closed.',
    inputSchema: {
      type: 'object',
      properties: {
        bugID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Bug ID.' },
        comment: { type: 'string', description: 'Close comment (optional).' }
      },
      required: ['bugID']
    }
  },
  {
    name: 'zentao_bug_reopen',
    description: 'Reopen/activate a closed or resolved bug (激活Bug). KB [api_reopen-bug]: sets status back to active. Optional re-assignment.',
    inputSchema: {
      type: 'object',
      properties: {
        bugID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Bug ID to reopen.' },
        assignedTo: { type: 'string', description: 'Re-assign to this account (optional).' },
        comment: { type: 'string', description: 'Reopen comment (optional).' }
      },
      required: ['bugID']
    }
  },

  // ---------- STORY SEARCH (server-side bySearch + saved queries) ----------
  {
    name: 'zentao_story_saved_queries',
    description: 'List the account\'s saved story search queries (已保存的查询条件) with queryID + title. Use to find a queryID for zentao_story_search (the efficient server-side path).',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', default: 20, description: 'Product context ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' }
      }
    }
  },
  {
    name: 'zentao_story_search',
    description: 'Search stories. Three modes (response carries mode): (1) conditions — ad-hoc server-side conditional search (临时条件搜索: temporary query created, executed, then auto-cleaned; needs the search feature point, else feature_not_enabled with alternatives); (2) queryID (from zentao_story_saved_queries) — saved server-side search; (3) keyword — client-side full-scan match on title/spec/keywords. Optional status/productID refine. total is always the full count; limit caps returned rows. For client-side conditional filtering (date range + title contains etc.) use zentao_filter.',
    inputSchema: {
      type: 'object',
      properties: {
        queryID: { type: 'integer', description: 'Saved story query ID for server-side search (preferred).' },
        keyword: { type: 'string', description: 'Text to match in title/spec/keywords (client-side full scan).' },
        conditions: {
          type: 'array',
          maxItems: 6,
          description: 'Ad-hoc server-side conditions (临时服务端条件搜索: creates a temporary query, runs it, then cleans it up). Takes precedence over queryID. Requires the deployment to have the search feature point enabled (otherwise returns feature_not_enabled with alternatives). Unknown field names are rejected with the deployment\'s available-field list (the server would silently drop them).',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', description: 'Field key. Bug: title keywords openedBy assignedTo status severity pri type module openedDate openedBuild. Story: title keywords openedBy assignedTo status category pri module openedDate.' },
              operator: { type: 'string', enum: ['=', '!=', '>', '>=', '<', '<=', 'include', 'notinclude', 'between', 'belong'], default: 'include', description: 'Operator. Omit to use the deployment-native default for that field (e.g. title→include, stage/status/pri→=, module→belong, date→=). Select-field values are validated against the deployment option domain (invalid → invalid_value with allowed list). Date range: two conditions openedDate>=start AND openedDate<=end (recommended), or operator=between with value "start,end".' },
              value: { type: 'string', description: 'Condition value (string; pass numbers/dates/IDs as strings). For between: "start,end".' },
              andOr: { type: 'string', enum: ['and', 'or'], default: 'and', description: 'Join with the PREVIOUS condition (2nd condition onwards). The 4th condition\'s andOr joins group 1 and group 2 (form model: 3+3). Default and.' }
            },
            required: ['field', 'value']
          }
        },

        productID: { type: 'integer', default: 20, description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        branch: { type: 'integer', default: 0, description: 'Branch ID (default 0).' },
        status: { type: 'string', enum: ['all', 'active', 'draft', 'changed', 'closed', 'wait', 'planned', 'projected', 'developing', 'developed', 'testing', 'tested', 'verified', 'released'], default: 'all', description: 'Extra status (KB: draft/active/closed/changed) or stage (KB: wait/planned/.../released) filter. [KB: api_695.md]' },
        limit: { type: 'integer', default: 20, description: 'Max stories to return (1-200). total is the full count.' }
      }
    }
  },

  // ---------- PRODUCT PLAN (产品计划/迭代) ----------
  {
    name: 'zentao_productplan_list',
    description: 'List product plans / iterations (产品计划/迭代) for a product, including story/bug/hour counts and date range. Full-paginated; total is the complete count.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        limit: { type: 'integer', default: 20, description: 'Max plans to return (1-200). total is the full count.' }
      },
      required: ['productID']
    }
  },
  {
    name: 'zentao_productplan_get',
    description: 'Get one product plan (迭代) detail by ID, including its stories and bugs.',
    inputSchema: {
      type: 'object',
      properties: {
        planID: { type: 'integer', description: 'Plan (迭代) ID.' }
      },
      required: ['planID']
    }
  },

  // ---------- TEST CASE (测试用例) ----------
  {
    name: 'zentao_testcase_list',
    description: 'List test cases (测试用例). 若当前部署/账号未开通「测试用例」功能点，首次调用会探测并返回 feature_not_enabled 错误（已开通的部署可正常使用）。',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        moduleID: { type: 'integer', description: 'Restrict to a module (optional).' },
        status: { type: 'string', description: 'Client-side status filter (optional, e.g. normal/changed).' },
        pri: { type: 'integer', description: 'Client-side priority filter (optional).' },
        limit: { type: 'integer', default: 20, description: 'Max cases to return (1-200). total is the full count.' }
      },
      required: ['productID']
    }
  },
  {
    name: 'zentao_testcase_get',
    description: 'Get test case (测试用例) detail. 若当前部署/账号未开通「测试用例」功能点，首次调用会探测并返回 feature_not_enabled 错误（已开通的部署可正常使用）。',
    inputSchema: {
      type: 'object',
      properties: {
        caseID: { type: 'integer', description: 'Test case ID.' }
      },
      required: ['caseID']
    }
  },
  {
    name: 'zentao_testcase_create',
    description: 'Create test case (测试用例). 若当前部署/账号未开通「测试用例」功能点，首次调用会探测并返回 feature_not_enabled 错误（已开通的部署可正常使用）。',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' },
        moduleID: { type: 'integer', description: 'Module ID.' },
        title: { type: 'string', description: 'Case title.' },
        precondition: { type: 'string', description: 'Precondition (前置条件).' },
        steps: { type: 'string', description: 'Steps with expected results (步骤+预期).' },
        pri: { type: 'integer', default: 3, minimum: 1, maximum: 4, description: 'Priority.' },
        type: { type: 'string', default: 'feature', description: 'Case type: feature/functional/interface/performance/security/others.' },
        keywords: { type: 'string', description: 'Preserve existing keywords; MCP marker appended. (optional)' }
      },
      required: ['productID', 'moduleID', 'title', 'precondition', 'steps']
    }
  },
  {
    name: 'zentao_testcase_update',
    description: 'Update testcase (修改用例). 若当前部署/账号未开通「测试用例」功能点，首次调用会探测并返回 feature_not_enabled 错误（已开通的部署可正常使用）。',
    inputSchema: {
      type: 'object',
      properties: {
        caseID: { type: 'integer', description: 'Testcase ID.' },
        title: { type: 'string', description: 'New title (optional).' },
        moduleID: { type: 'integer', description: 'Module ID (optional).' },
        storyID: { type: 'integer', description: 'Linked story ID (optional).' },
        type: { type: 'string', description: 'Case type (optional).' },
        stage: { type: 'string', description: 'Applicable stage (optional).' },
        pri: { type: 'integer', description: '优先级：0=未设置 1=紧急 2=高 3=中 4=低（可选）。' },
        precondition: { type: 'string', description: 'Precondition (optional).' },
        steps: { type: 'array', items: { type: 'object', properties: { step: { type: 'string' }, expect: { type: 'string' } } }, description: 'Steps array (replaces all steps if provided).' },
        comment: { type: 'string', description: 'Edit comment (optional).' }
      },
      required: ['caseID']
    }
  },
  {
    name: 'zentao_testcase_run',
    description: 'Run/record test case result (执行用例). 若当前部署/账号未开通「测试用例」功能点，首次调用会探测并返回 feature_not_enabled 错误（已开通的部署可正常使用）。',
    inputSchema: {
      type: 'object',
      properties: {
        caseID: { type: 'integer', description: 'Test case ID to run.' },
        result: { type: 'string', enum: ['pass', 'fail', 'blocked', 'na'], description: 'Overall result. pass=通过, fail=失败, blocked=阻塞, na=不适用.' },
        realResult: { type: 'string', description: 'Actual result description (actual result/real result).' },
        testtaskID: { type: 'integer', description: 'Test task ID context (optional, defaults to 0).' }
      },
      required: ['caseID', 'result']
    }
  },

  // ---------- TEST TASK (测试单) / TEST REPORT (报告) / TEST SUITE (套件) ----------
  {
    name: 'zentao_testtask_list',
    description: 'List test tasks (测试单) for a product. Full-paginated; total is the complete count. (May be 0 if no test tasks yet.)',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        limit: { type: 'integer', default: 20, description: 'Max tasks to return (1-200). total is the full count.' }
      },
      required: ['productID']
    }
  },
  {
    name: 'zentao_testreport_list',
    description: 'List test reports (测试报告) for a product. Full-paginated; total is the complete count.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        limit: { type: 'integer', default: 20, description: 'Max reports to return (1-200). total is the full count.' }
      },
      required: ['productID']
    }
  },
  {
    name: 'zentao_testsuite_list',
    description: 'List test suites (测试套件) for a product. Full-paginated; total is the complete count.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        limit: { type: 'integer', default: 20, description: 'Max suites to return (1-200). total is the full count.' }
      },
      required: ['productID']
    }
  },

  // ---------- EXECUTION / ITERATION ----------
  {
    name: 'zentao_execution_list',
    description: 'List executions (执行/迭代) for a product. Returns id, name, code, status, begin, end, hours, stories, bugs. Full-paginated.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        status: { type: 'string', enum: ['all', 'normal', 'closed'], default: 'all', description: 'Filter: all, normal (进行中), closed (已关闭).' },
        limit: { type: 'integer', default: 20, description: 'Max executions to return (1-200). total is the full count.' }
      },
      required: ['productID']
    }
  },
  {
    name: 'zentao_execution_get',
    description: 'Get one execution (执行/迭代) detail by ID: name, code, status, begin/end dates, team, stories, bugs, tasks. Set detail=true for full lists.',
    inputSchema: {
      type: 'object',
      properties: {
        executionID: { type: 'integer', description: 'Execution ID.' },
        detail: { type: 'boolean', default: false, description: 'If true, return full story/bug/task lists (up to 200 each). Defaults to 20 each.' },
        limit: { type: 'integer', description: 'Max items per list (1-200). Defaults to 20 (or 200 if detail=true).' }
      },
      required: ['executionID']
    }
  },

  // ---------- TASK ----------
  {
    name: 'zentao_task_list',
    description: 'List tasks (任务) for an execution. Returns id, name, type, pri, estimate, left, deadline, status, assignedTo, story. KB [api_get-execution-tasks]. Every item includes a clickable url.',
    inputSchema: {
      type: 'object',
      properties: {
        executionID: { type: 'integer', description: 'Execution ID whose tasks to list.' },
        status: { type: 'string', enum: ['all', 'wait', 'doing', 'done', 'blocked', 'paused'], default: 'all', description: 'Filter by task status.' },
        limit: { type: 'integer', default: 50, description: 'Max tasks to return (1-200).' }
      },
      required: ['executionID']
    }
  },
  {
    name: 'zentao_task_create',
    description: 'Create a task (任务) in a project. KB [api_create-task]: name, type, assignedTo, estStarted, deadline required. executionID is actually projectID in this ZenTao version. Type: design/devel/request/test/study/discuss/ui/affair/misc.',
    inputSchema: {
      type: 'object',
      properties: {
        executionID: { type: 'integer', description: 'Execution ID (迭代ID).' },
        name: { type: 'string', description: 'Task name (任务名称).' },
        type: { type: 'string', enum: ['design', 'devel', 'request', 'test', 'study', 'discuss', 'ui', 'affair', 'misc'], description: 'Task type.' },
        assignedTo: { type: 'string', description: 'Assignee account (指派给).' },
        storyID: { type: 'integer', description: 'Related story ID (关联需求, optional).' },
        moduleID: { type: 'integer', description: 'Module ID (所属模块, optional).' },
        pri: { type: 'integer', description: '优先级：0=未设置 1=紧急 2=高 3=中 4=低（可选）。' },
        estimate: { type: 'number', description: 'Estimated hours (optional).' },
        estStarted: { type: 'string', description: 'Expected start date YYYY-MM-DD (required by KB).' },
        deadline: { type: 'string', description: 'Expected end date YYYY-MM-DD (required by KB).' }
      },
      required: ['executionID', 'name', 'type', 'assignedTo', 'estStarted', 'deadline']
    }
  },
  {
    name: 'zentao_task_start',
    description: 'Start a task (开始任务: wait→doing). KB [api_start-task]. Sets realStarted, consumed, left. urlencoded POST.',
    inputSchema: {
      type: 'object',
      properties: {
        taskID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Task ID.' },
        left: { type: 'number', description: 'Remaining hours (预计剩余, required by KB).' },
        consumed: { type: 'number', description: 'Hours consumed so far (optional).' },
        comment: { type: 'string', description: 'Note (optional).' }
      },
      required: ['taskID', 'left']
    }
  },
  {
    name: 'zentao_task_finish',
    description: 'Finish a task (完成任务: doing→done). KB [api_finish-task]. Sets currentConsumed, finishedDate. multipart POST.',
    inputSchema: {
      type: 'object',
      properties: {
        taskID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Task ID.' },
        currentConsumed: { type: 'number', description: 'Hours consumed this session (本次消耗, required by KB).' },
        comment: { type: 'string', description: 'Note (optional).' }
      },
      required: ['taskID', 'currentConsumed']
    }
  },
  {
    name: 'zentao_task_update',
    description: 'Edit a task (修改任务). KB [api_edit-task]. Can update name, type, assignedTo, pri, estimate, deadline. multipart POST.',
    inputSchema: {
      type: 'object',
      properties: {
        taskID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Task ID.' },
        name: { type: 'string', description: 'New task name (optional).' },
        type: { type: 'string', enum: ['design', 'devel', 'request', 'test', 'study', 'discuss', 'ui', 'affair', 'misc'], description: 'Task type (optional).' },
        assignedTo: { type: 'string', description: 'New assignee (optional).' },
        pri: { type: 'integer', description: '优先级：0=未设置 1=紧急 2=高 3=中 4=低（可选）。' },
        estimate: { type: 'number', description: 'Estimated hours (optional).' },
        deadline: { type: 'string', description: 'New deadline YYYY-MM-DD (optional).' }
      },
      required: ['taskID']
    }
  },
  {
    name: 'zentao_task_close',
    description: 'Close a task (关闭任务: done→closed). KB [api_close-task]. urlencoded POST.',
    inputSchema: {
      type: 'object',
      properties: {
        taskID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Task ID.' },
        comment: { type: 'string', description: 'Note (optional).' }
      },
      required: ['taskID']
    }
  },
  {
    name: 'zentao_execution_create',
    description: 'Create an execution/iteration (创建执行/迭代). KB [api_create-execution]. Route: project-create in this ZenTao version.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Execution name (名称).' },
        code: { type: 'string', description: 'Execution code (代号).' },
        begin: { type: 'string', description: 'Start date YYYY-MM-DD.' },
        end: { type: 'string', description: 'End date YYYY-MM-DD.' },
        days: { type: 'integer', description: 'Working days (optional).' },
        desc: { type: 'string', description: 'Description (optional).' },
        productID: { type: 'integer', description: 'Product ID to associate (optional).' }
      },
      required: ['name', 'code', 'begin', 'end']
    }
  },
  {
    name: 'zentao_task_pause',
    description: 'Pause a task (暂停任务: doing→paused). KB [api_pause-task].',
    inputSchema: {
      type: 'object',
      properties: {
        taskID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Task ID.' },
        comment: { type: 'string', description: 'Note (optional).' }
      },
      required: ['taskID']
    }
  },
  {
    name: 'zentao_task_log_add',
    description: 'Add a task work log/estimate record (添加任务日志). KB [api_add-task-log]. Route: effort-createForObject-task-{id} (form on /task-recordEstimate-{id}.html).',
    inputSchema: {
      type: 'object',
      properties: {
        taskID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Task ID.' },
        work: { type: 'string', description: 'Work content (工作内容, required).' },
        consumed: { type: 'number', description: 'Hours consumed (消耗工时).' },
        left: { type: 'number', description: 'Hours remaining (预计剩余, required — task\'s current left minus consumed).' },
        date: { type: 'string', description: 'Log date YYYY-MM-DD (default today).' }
      },
      required: ['taskID', 'work', 'left']
    }
  },
  {
    name: 'zentao_task_resume',
    description: 'Resume a task (继续任务: paused→doing). KB [api_resume-task]. Route: task-restart.',
    inputSchema: {
      type: 'object',
      properties: {
        taskID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Task ID.' },
        left: { type: 'number', description: 'Remaining hours (required by KB).' },
        comment: { type: 'string', description: 'Note (optional).' }
      },
      required: ['taskID', 'left']
    }
  },
  {
    name: 'zentao_story_delete',
    description: 'Delete a story (删除需求). Destructive. Two-step: confirm + delete.',
    inputSchema: {
      type: 'object',
      properties: {
        storyID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Story ID to delete.' }
      },
      required: ['storyID']
    }
  },
  {
    name: 'zentao_bug_delete',
    description: 'Delete a bug (删除Bug). Destructive. Two-step: confirm + delete.',
    inputSchema: {
      type: 'object',
      properties: {
        bugID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Bug ID to delete.' }
      },
      required: ['bugID']
    }
  },
  {
    name: 'zentao_task_delete',
    description: 'Delete a task (删除任务). Destructive. Two-step: confirm + delete.',
    inputSchema: {
      type: 'object',
      properties: {
        taskID: { type: ['integer', 'array'], items: { type: 'integer' }, description: 'Task ID to delete.' }
      },
      required: ['taskID']
    }
  },

  {
    name: 'zentao_productplan_create',
    description: 'Create a product plan/iteration (创建产品计划). KB [api_create-plan].',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' },
        title: { type: 'string', description: 'Plan title (计划名称).' },
        begin: { type: 'string', description: 'Start date YYYY-MM-DD (optional).' },
        end: { type: 'string', description: 'End date YYYY-MM-DD (optional).' },
        desc: { type: 'string', description: 'Description (optional).' }
      },
      required: ['productID', 'title']
    }
  },

  {
    name: 'zentao_product_delete',
    description: 'Delete a product (删除产品). ⚠️ 最高危操作：级联删除所有需求/Bug/用例/计划/模块/版本。默认 dry_run=true。需 confirmToken + confirmPhrase 二次确认。',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID to delete.' },
        dry_run: { type: 'boolean', default: true, description: 'true=预览(默认), false=真正删除(需confirmToken+confirmPhrase).' },
        confirmToken: { type: 'string', description: '二次确认令牌(首次dry_run返回).' },
        confirmPhrase: { type: 'string', description: '确认短语(首次dry_run返回的confirm_instruction中).' }
      },
      required: ['productID']
    }
  },
  {
    name: 'zentao_execution_delete',
    description: 'Delete an execution/project (删除执行/项目). ⚠️ 极高危操作，默认 dry_run=true 只预览不删除。需二次确认：首次调用获取 confirmToken，第二次带 confirmToken 才真正删除。',
    inputSchema: {
      type: 'object',
      properties: {
        executionID: { type: 'integer', description: 'Execution/Project ID to delete.' },
        dry_run: { type: 'boolean', default: true, description: 'true=预览(默认), false=真正删除(需confirmToken).' },
        confirmToken: { type: 'string', description: '二次确认令牌(首次dry_run返回).' },
        confirmPhrase: { type: 'string', description: '确认短语(首次dry_run返回的confirm_instruction中).' }
      },
      required: ['executionID']
    }
  },
  {
    name: 'zentao_productplan_delete',
    description: 'Delete a product plan (删除产品计划). ⚠️ 极高危操作，默认 dry_run=true 只预览不删除。需二次确认：首次调用获取 confirmToken，第二次带 confirmToken 才真正删除。',
    inputSchema: {
      type: 'object',
      properties: {
        planID: { type: 'integer', description: 'Plan ID to delete.' },
        dry_run: { type: 'boolean', default: true, description: 'true=预览(默认), false=真正删除(需confirmToken).' },
        confirmToken: { type: 'string', description: '二次确认令牌(首次dry_run返回).' },
        confirmPhrase: { type: 'string', description: '确认短语(首次dry_run返回的confirm_instruction中).' }
      },
      required: ['planID']
    }
  },

  {
    name: 'zentao_build_create',
    description: 'Create a build/version (创建版本). KB [api_create-build]. Builds attach to a PROJECT (execution), not a product. Route: /build-create-{projectID}.html.',
    inputSchema: {
      type: 'object',
      properties: {
        projectID: { type: 'integer', description: 'Project ID (所属项目, e.g. 42).' },
        productID: { type: 'integer', description: 'Product ID (所属产品). Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        name: { type: 'string', description: 'Build name (版本名称).' },
        builder: { type: 'string', description: 'Builder account (构建者, default current user).' },
        date: { type: 'string', description: 'Build date YYYY-MM-DD (optional, default today).' },
        desc: { type: 'string', description: 'Description (optional).' }
      },
      required: ['projectID', 'name']
    }
  },

  // ---------- BUILD / VERSION ----------
  {
    name: 'zentao_build_list',
    description: 'List builds (版本) for a product. Returns id, name, date, status, stories, bugs, cases. Full-paginated.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        limit: { type: 'integer', default: 20, description: 'Max builds to return (1-200). total is the full count.' }
      },
      required: ['productID']
    }
  },

  // ---------- MODULE ----------
  {
    name: 'zentao_module_list',
    description: 'List modules (模块) for a product. Returns id, name, parent, sort, stories, bugs. Full-paginated.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' },
        limit: { type: 'integer', default: 50, description: 'Max modules to return (1-200). total is the full count.' }
      },
      required: ['productID']
    }
  },

  // ---------- BUILD DETAIL ----------
  {
    name: 'zentao_build_get',
    description: 'Get one build (版本) detail by ID: name, date, status, scope, related stories/bugs/cases counts and lists.',
    inputSchema: {
      type: 'object',
      properties: {
        buildID: { type: 'integer', description: 'Build ID.' }
      },
      required: ['buildID']
    }
  },
  {
    name: 'zentao_build_delete',
    description: 'Delete a build (删除版本). Two-step: dry_run (default) returns info + confirmToken + confirmPhrase. Set dry_run=false with confirmPhrase="DELETE BUILD {id}" to execute.',
    inputSchema: {
      type: 'object',
      properties: {
        buildID: { type: 'integer', description: 'Build ID.' },
        dry_run: { type: 'boolean', description: 'Default true. Set false to execute deletion.' },
        confirmToken: { type: 'string', description: 'Token from dry_run response (required when dry_run=false).' },
        confirmPhrase: { type: 'string', description: 'Must be exactly: DELETE BUILD {id} (required when dry_run=false).' }
      },
      required: ['buildID']
    }
  },

  // ---------- MODULE TREE ----------
  {
    name: 'zentao_module_create',
    description: 'Create a module (创建模块). Route: tree-manageChild-{product}-{type}.html (form on tree-browse page). type: story|bug|case.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' },
        name: { type: 'string', description: 'Module name (required).' },
        parentID: { type: 'integer', description: 'Parent module ID (default 0 = top level).' },
        type: { type: 'string', enum: ['story', 'bug', 'case'], description: 'Module type (default story).' },
        shorts: { type: 'string', description: 'Shorts/abbreviation (optional).' }
      },
      required: ['productID', 'name']
    }
  },
  {
    name: 'zentao_module_rename',
    description: 'Rename a module and/or change its parent (重命名模块/移动父子关系). Route: /tree-edit-{id}-{type}.html.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' },
        moduleID: { type: 'integer', description: 'Module ID.' },
        type: { type: 'string', enum: ['story', 'bug', 'case'], description: 'Module type (default story).' },
        name: { type: 'string', description: 'New module name (optional — omit to keep current).' },
        parentID: { type: 'integer', description: 'New parent module ID (optional — omit to keep current). 0 = top level.' },
        shorts: { type: 'string', description: 'New shorts (optional).' }
      },
      required: ['productID', 'moduleID']
    }
  },
  {
    name: 'zentao_module_delete',
    description: 'Delete a module (删除模块). ⚠️ 高危：级联删除所有子模块（模块下的需求/Bug/用例不会被删，变为无模块）。默认 dry_run=true，需 confirmToken + confirmPhrase 二次确认。',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID.' },
        moduleID: { type: 'integer', description: 'Module ID to delete.' },
        type: { type: 'string', enum: ['story', 'bug', 'case'], description: 'Module type (default story).' },
        dry_run: { type: 'boolean', default: true, description: 'true=预览(默认), false=真正删除(需confirmToken+confirmPhrase).' },
        confirmToken: { type: 'string', description: '二次确认令牌(首次dry_run返回).' },
        confirmPhrase: { type: 'string', description: '确认短语(首次dry_run返回的confirm_instruction中).' }
      },
      required: ['productID', 'moduleID']
    }
  },
  {
    name: 'zentao_module_tree',
    description: 'Get the module hierarchy (模块树) for a product as a nested tree. Returns root modules with children recursively.',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'integer', description: 'Product ID. Omit to use the deployment profile primary product (see zentao_context/zentao_profile).' }
      },
      required: ['productID']
    }
  },

  // ---------- PRODUCTPLAN → STORY LINK ----------
  {
    name: 'zentao_productplan_link_story',
    description: 'Link a story to a product plan (产品计划关联需求). KB [api_plan-link-story]: POST /productplans/id/linkstories. This is the correct ZenTao model for associating stories with plans (not executions).',
    inputSchema: {
      type: 'object',
      properties: {
        planID: { type: 'integer', description: 'Product plan ID.' },
        storyIDs: { type: 'array', items: { type: 'integer' }, description: 'Story IDs to link (e.g. [11, 12]).' }
      },
      required: ['planID', 'storyIDs']
    }
  },
  {
    name: 'zentao_productplan_unlink_story',
    description: 'Unlink a story from a product plan (产品计划取消关联需求). KB [api_plan-unlink-story].',
    inputSchema: {
      type: 'object',
      properties: {
        planID: { type: 'integer', description: 'Product plan ID.' },
        storyIDs: { type: 'array', items: { type: 'integer' }, description: 'Story IDs to unlink.' }
      },
      required: ['planID', 'storyIDs']
    }
  },

  // ---------- PRODUCTPLAN → BUG LINK ----------
  {
    name: 'zentao_productplan_link_bug',
    description: 'Link a bug to a product plan (产品计划关联Bug). KB [api_plan-link-bug]: POST /productplans/id/linkbugs.',
    inputSchema: {
      type: 'object',
      properties: {
        planID: { type: 'integer', description: 'Product plan ID.' },
        bugIDs: { type: 'array', items: { type: 'integer' }, description: 'Bug IDs to link (e.g. [7, 8]).' }
      },
      required: ['planID', 'bugIDs']
    }
  },
  {
    name: 'zentao_productplan_unlink_bug',
    description: 'Unlink a bug from a product plan (产品计划取消关联Bug). KB [api_plan-unlink-bug].',
    inputSchema: {
      type: 'object',
      properties: {
        planID: { type: 'integer', description: 'Product plan ID.' },
        bugIDs: { type: 'array', items: { type: 'integer' }, description: 'Bug IDs to unlink.' }
      },
      required: ['planID', 'bugIDs']
    }
  }
];
