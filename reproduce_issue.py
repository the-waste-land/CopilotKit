import json

def main(llm: str, query, skill_id: str, is_query_have_compete) -> dict:
    """
    处理LLM响应并提取路由和产品信息
    
    Args:
        llm (str): LLM响应的JSON字符串
        query (str): 用户查询
        intention: 意图信息，如果不为空则覆盖router
        
    Returns:
        dict: 包含路由和产品信息的字典
    """
    cleaned_llm = llm.replace("```json", "").replace("```", "").strip()
    
    def try_parse(s):
        try:
            return json.loads(s)
        except json.JSONDecodeError:
            # 尝试修复 LLM 常见的转义错误
            # 1. 修复像 "key": \"value\"" 这样的错误
            fixed = re.sub(r':\s*\\"', ': "', s)
            fixed = re.sub(r'\\"\s*([,}])', r'"\1', fixed)
            # 2. 修复可能存在的双引号问题
            fixed = fixed.replace('""', '"')
            try:
                return json.loads(fixed)
            except:
                # 3. 如果还是不行，尝试提取 JSON 部分
                match = re.search(r'(\{.*\})', s, re.DOTALL)
                if match:
                    # 对提取出的内容再尝试一遍修复
                    inner = match.group(1)
                    inner_fixed = re.sub(r':\s*\\"', ': "', inner)
                    inner_fixed = re.sub(r'\\"\s*([,}])', r'"\1', inner_fixed)
                    inner_fixed = inner_fixed.replace('""', '"')
                    try:
                        return json.loads(inner_fixed)
                    except:
                        raise
                raise

    import re
    data = try_parse(cleaned_llm)
    
    router = data.get("router", "意图不明确")
    
    # 如果intention不为空，使用intention的值覆盖router
    if skill_id:
        router_skip_map = {
            "find_doc": "查找文档",
            "product_parameter": "产品参数查询",
            "product_compare": "产品参数对比"
        }
        router = router_skip_map.get(skill_id, "")
    
    search_query = data.get("search_query", "未提取到产品")
    lower_product = data.get("product", "未提取到产品").lower()
    product_list = data.get("product_list", "[]")
    product_list = json.loads(product_list)
    retrive_query = list(set([*product_list, query, search_query]))
    if router == "产品参数查询":
        if len(product_list) > 0:
            tags = [router]
        else:
            tags = [router, "无产品型号问答"]
    else:
        tags = [router]

    if is_query_have_compete == 'True':
        tags = ['竞争信息问答']

    return {
        "router": router,
        "search_query": search_query,
        "retrive_query": retrive_query,
        "product_list": product_list,
        "tags": tags
    }

if __name__ == "__main__":
    # The user's input llm string as it would appear in Python if received via JSON
    # Input: { "llm": "{ \"router\": \"查找文档\", \"product_list\": \"[\\\"EG86DS\\\"]\", \"search_query\": \\\"EG86DS能效证书\\\"\" }", ... }
    
    # Let's simulate receiving the input as a JSON object
    input_json_str = """
    {
      "llm": "{ \\"router\\": \\"查找文档\\", \\"product_list\\": \\"[\\\\\\"EG86DS\\\\\\"]\\", \\"search_query\\": \\\\\\"EG86DS能效证书\\\\\\"\\" }",
      "query": "EG86DS能效证书",
      "skill_id": "",
      "is_query_have_compete": "False"
    }
    """
    # Wait, the user's input shows:
    # "llm": "{ \"router\": \"查找文档\", \"product_list\": \"[\\\"EG86DS\\\"]\", \"search_query\": \\\"EG86DS能效证书\\\"\" }"
    # If I copy paste that into a python string:
    llm = "{ \"router\": \"查找文档\", \"product_list\": \"[\\\"EG86DS\\\"]\", \"search_query\": \\\"EG86DS能效证书\\\"\" }"
    
    print(f"Original LLM string: {llm}")
    try:
        result = main(llm, "EG86DS能效证书", "", "False")
        print(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
