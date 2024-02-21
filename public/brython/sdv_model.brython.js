__BRYTHON__.use_VFS = true;
var scripts = {
    $timestamp: 1690889724567,
    plugins: [
        ".py",
        "from browser import window\n\ndef get_plugin(plugin_name:str):\n plugins=window.PYTHON_BRIDGE.plugins\n if plugin_name not in plugins:\n  raise AttributeError(f\"No plugin with the name '{plugin_name}'.\")\n  \n return plugins[plugin_name]\n \ndef __getattr__(plugin_name:str):\n return get_plugin(plugin_name)\n",
        ["browser"],
        1,
    ],
    sdv_model: [
        ".py",
        'from .CallProxy import CallProxy\n\nclass SDVModel(CallProxy):\n def __init__(self,root_node:str):\n  super().__init__(root_node)\n  \n  \nclass Vehicle(SDVModel):\n def __init__(self):\n  super().__init__("Vehicle")\n  \n',
        ["sdv_model.CallProxy"],
        1,
    ],
    "sdv_model.spec": [
        ".py",
        "from browser import window\nimport json\n\nspec=json.loads(window.VSS_SPEC)\nwishlist_apis=json.loads(window.VSS_CUSTOM_APIS)\n",
        ["browser", "json"],
        1,
    ],
    "sdv_model.CallProxy": [
        ".py",
        'from typing import Callable\nfrom ..spec import spec,wishlist_apis\nfrom browser import window,timer,aio\nimport javascript\n\nIntTypes=["uint8","uint16","uint32","int8","int16","int32"]\nFloatTypes=["float","double"]\nStringTypes=["string"]\nBoolTypes=["boolean"]\nListOfStringTypes=["string[]"]\nListOfIntTypes=["uint8[]"]\n\ndef get_node_by_name(name:str):\n path=name.split(".")\n nesting,final_name=".".join(path[:-1]),path[-1]\n if nesting in wishlist_apis and final_name in wishlist_apis[nesting]:\n  return wishlist_apis[nesting][final_name]\n  \n current=spec[path[0]]\n for n in path[1:]:\n  current=current["children"][n]\n  \n return current\n \n \n \nclass CallProxy:\n def __init__(self,name:str=""):\n  self.name=name\n  self.api=get_node_by_name(name)\n  if self.api["type"]!="branch":\n   self.__listeners:\'list[Callable]\'=[]\n   self.__history:list=[]\n   self.__called:int=0\n   self.__value=CallProxy._default_value(self.api["datatype"])\n   self.__interval=timer.set_interval(self.ticker,200)\n   if "allowed"in self.api:\n    for value in self.api["allowed"]:\n     setattr(self,value,value)\n     \n  self.__children_objs={}\n  self.wishlist_api_children=wishlist_apis[self.name]if self.name in wishlist_apis else {}\n  \n def __del__(self):\n  object.__del__(self)\n  timer.clear_intevral(self.__interval)\n  \n @staticmethod\n def _default_value(datatype:str):\n  if datatype in IntTypes:\n   return 0\n  elif datatype in FloatTypes:\n   return 0.0\n  elif datatype in StringTypes:\n   return ""\n  elif datatype in ListOfStringTypes:\n   return []\n  elif datatype in BoolTypes:\n   return False\n  elif datatype in ListOfIntTypes:\n   return []\n  raise Exception(f"unknown datatype: {datatype}")\n  \n def __assert_value(self,value):\n  datatype=self.api["datatype"]\n  if (datatype in IntTypes)or (datatype in FloatTypes):\n   if datatype in IntTypes:\n    assert isinstance(value,int)\n   elif datatype in FloatTypes:\n    assert isinstance(value,(float,int))\n    \n   if "min"in self.api:\n    assert value >=self.api["min"]\n   if "max"in self.api:\n    assert value <=self.api["max"]\n  elif datatype in StringTypes:\n   assert isinstance(value,str)\n   if "allowed"in self.api:\n    assert value in self.api["allowed"]\n  elif datatype in BoolTypes:\n   assert isinstance(value,bool)\n  elif datatype in ListOfStringTypes:\n   assert isinstance(value,list)\n   for item in value:assert isinstance(item,str)\n  elif datatype in ListOfIntTypes:\n   assert isinstance(value,list)\n   for item in value:assert isinstance(item,int)\n  else :\n   raise Exception(f"unknown datatype: {datatype}")\n def ticker(self):\n  self.checkNewData()\n  \n def checkNewData(self):\n  valueInMap=window.PYTHON_BRIDGE.valueMap.get(self.name)\n  if valueInMap ==javascript.UNDEFINED:\n   window.PYTHON_BRIDGE.valueMap.set(self.name,self.__value)\n  else :\n   if valueInMap !=self.__value:\n    if self.api["type"]=="sensor":\n     self.__assert_value(valueInMap)\n     self.__history.append(self.__value)\n     self.__value=valueInMap\n     window.PYTHON_BRIDGE.valueMap.set(self.name,valueInMap)\n     window.PYTHON_BRIDGE.INTERNALS.update_monitor(dict(\n     name=self.name,\n     value=self.__value,\n     called=self.__called,\n     history=self.__history\n     ))\n     for listener in self.__listeners:\n      try :aio.run(listener(valueInMap))\n      except Exception as e:\n       print("An exception on call listener:",e)\n       \n    if self.api["type"]=="actuator":\n     aio.run(self.set(valueInMap))\n     \n async def get(self):\n  assert self.api["type"]!="branch",f"{self.api[\'type\']} \'{self.name}\' has no get() function"\n  \n  intercepting_func=window.PYTHON_BRIDGE.interceptor(self.name,"get")\n  if intercepting_func is not None :\n   return await intercepting_func([],self.__value)\n   \n  return self.__value\n  \n async def set(self,value):\n  assert self.api["type"]in ["actuator"],f"{self.api[\'type\']} \'{self.name}\' has no set() function"\n  \n  self.__assert_value(value)\n  \n  for listener in self.__listeners:\n   try :await listener(value)\n   except Exception as e:\n    pass\n    \n  self.__history.append(self.__value)\n  self.__value=value\n  self.__called +=1\n  window.PYTHON_BRIDGE.valueMap.set(self.name,value)\n  \n  window.PYTHON_BRIDGE.INTERNALS.update_monitor(dict(\n  name=self.name,\n  value=self.__value,\n  called=self.__called,\n  history=self.__history\n  ))\n  \n  intercepting_func=window.PYTHON_BRIDGE.interceptor(self.name,"set")\n  if intercepting_func is not None :\n   return await intercepting_func([value],None )\n   \n async def subscribe(self,func:Callable):\n  assert self.api["type"]in ["actuator","sensor"],f"{self.api[\'type\']} \'{self.name}\' has no subscribe() function"\n  \n  \n  \n  self.__listeners.append(func)\n  \n  \n  intercepting_func=window.PYTHON_BRIDGE.interceptor(self.name,"subscribe")\n  if intercepting_func is not None :\n   return await intercepting_func([func],None )\n   \n def __repr__(self):\n  value_str=""if self.api["type"]=="branch"else (" value="+str(self.__value))\n  return f"<{self.name} {self.api[\'type\']}"+value_str+">"\n  \n def __getattr__(self,attr:str):\n  if self.api["type"]!="branch":\n   raise AttributeError(f"{self.name} is a {self.api[\'type\']}, not a branch")\n   \n  if attr in self.__children_objs:\n   return self.__children_objs[attr]\n   \n  if attr not in self.api["children"]and attr not in self.wishlist_api_children:\n   raise AttributeError(f"{self.name} has no child {attr}")\n   \n  self.__children_objs[attr]=CallProxy(self.name+"."+attr)\n  \n  return self.__children_objs[attr]\n',
        ["browser", "javascript", "sdv_model.spec", "typing"],
        1,
    ],
};
__BRYTHON__.update_VFS(scripts);
