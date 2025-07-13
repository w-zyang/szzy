"""
PPT生成器插件包
包含各种增强PPT生成功能的插件
"""

# 导入所有插件模块，方便使用
try:
    from .advanced_charts import AdvancedChartComponent
except ImportError:
    pass

try:
    from .slide_beautifier import (
        BackgroundStyleComponent, 
        ShapeStyleComponent,
        FooterComponent,
        WatermarkComponent
    )
except ImportError:
    pass

try:
    from .theme_styles import (
        get_theme_config,
        apply_theme_to_slide_data,
        get_available_themes
    )
except ImportError:
    pass 