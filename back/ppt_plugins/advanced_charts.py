"""
高级图表插件
提供更丰富的图表样式和功能
"""

import logging
import traceback
from io import BytesIO
from pptx.util import Inches
from pptx.dml.color import RGBColor
from improved_ppt_generator import SlideComponentBase

# 配置日志
logger = logging.getLogger("advanced_charts_plugin")

# 检查matplotlib可用性
try:
    import matplotlib.pyplot as plt
    import numpy as np
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    logger.warning("matplotlib或numpy未安装，高级图表功能不可用")

class AdvancedChartComponent(SlideComponentBase):
    """提供高级图表功能的组件"""
    
    def apply(self, slide, data, context=None):
        """应用高级图表到幻灯片"""
        if not data.get('advanced_chart') or not HAS_MATPLOTLIB:
            return slide
            
        try:
            chart_data = data['advanced_chart']
            chart_type = chart_data.get('type', 'bar')
            
            # 设置图表风格
            plt.style.use(chart_data.get('style', 'seaborn-v0_8-whitegrid'))
            
            # 创建图形
            fig_width = chart_data.get('width', 10)
            fig_height = chart_data.get('height', 6)
            plt.figure(figsize=(fig_width, fig_height), dpi=100)
            
            # 根据图表类型创建不同的图表
            if chart_type == 'radar':
                self._create_radar_chart(chart_data)
            elif chart_type == 'bubble':
                self._create_bubble_chart(chart_data)
            elif chart_type == 'histogram':
                self._create_histogram(chart_data)
            elif chart_type == 'stacked_bar':
                self._create_stacked_bar(chart_data)
            elif chart_type == 'scatter':
                self._create_scatter_plot(chart_data)
            elif chart_type == 'boxplot':
                self._create_boxplot(chart_data)
            elif chart_type == 'heatmap':
                self._create_heatmap(chart_data)
            else:
                # 默认为普通图表
                logger.warning(f"未知的高级图表类型: {chart_type}，使用标准图表")
                return slide
            
            # 保存图表到内存
            img_data = BytesIO()
            plt.savefig(img_data, format='png', bbox_inches='tight')
            img_data.seek(0)
            
            # 设置图表位置
            left = Inches(chart_data.get('left_position', 1))
            top = Inches(chart_data.get('top_position', 2))
            width = Inches(chart_data.get('display_width', 8))
            height = Inches(chart_data.get('display_height', 4.5))
            
            # 添加图表图像到幻灯片
            slide.shapes.add_picture(img_data, left, top, width, height)
            
            # 关闭matplotlib图表
            plt.close()
            
        except Exception as e:
            logger.error(f"添加高级图表失败: {str(e)}")
            logger.error(traceback.format_exc())
            
        return slide
        
    def _create_radar_chart(self, chart_data):
        """创建雷达图"""
        categories = chart_data.get('categories', [])
        values = chart_data.get('values', [])
        title = chart_data.get('title', '雷达图')
        
        if not categories or not values:
            logger.warning("雷达图的类别或值为空")
            return
            
        # 计算角度
        N = len(categories)
        angles = np.linspace(0, 2*np.pi, N, endpoint=False).tolist()
        
        # 闭合雷达图
        values = values + [values[0]]
        angles = angles + [angles[0]]
        categories = categories + [categories[0]]
        
        # 创建极坐标图
        ax = plt.subplot(111, polar=True)
        
        # 绘制雷达图
        ax.plot(angles, values, 'o-', linewidth=2)
        ax.fill(angles, values, alpha=0.25)
        
        # 设置刻度标签
        ax.set_thetagrids(np.degrees(angles[:-1]), categories[:-1])
        
        # 设置y轴范围
        ax.set_ylim(0, max(values) * 1.1)
        
        # 设置标题
        plt.title(title)
        
    def _create_bubble_chart(self, chart_data):
        """创建气泡图"""
        x_values = chart_data.get('x_values', [])
        y_values = chart_data.get('y_values', [])
        sizes = chart_data.get('sizes', [])
        labels = chart_data.get('labels', [])
        title = chart_data.get('title', '气泡图')
        
        if not x_values or not y_values or not sizes:
            logger.warning("气泡图的数据不完整")
            return
            
        # 绘制气泡图
        scatter = plt.scatter(x_values, y_values, s=sizes, alpha=0.5)
        
        # 设置标签
        if labels:
            for i, label in enumerate(labels):
                if i < len(x_values) and i < len(y_values):
                    plt.annotate(label, (x_values[i], y_values[i]))
        
        # 设置标题和轴标签
        plt.title(title)
        plt.xlabel(chart_data.get('x_label', 'X轴'))
        plt.ylabel(chart_data.get('y_label', 'Y轴'))
        
        # 添加颜色图例
        plt.colorbar(scatter)
        
    def _create_histogram(self, chart_data):
        """创建直方图"""
        values = chart_data.get('values', [])
        bins = chart_data.get('bins', 10)
        title = chart_data.get('title', '直方图')
        
        if not values:
            logger.warning("直方图的数据为空")
            return
            
        # 绘制直方图
        plt.hist(values, bins=bins, alpha=0.7, color=chart_data.get('color', 'blue'))
        
        # 设置标题和轴标签
        plt.title(title)
        plt.xlabel(chart_data.get('x_label', '值'))
        plt.ylabel(chart_data.get('y_label', '频率'))
        
    def _create_stacked_bar(self, chart_data):
        """创建堆叠柱状图"""
        categories = chart_data.get('categories', [])
        series_list = chart_data.get('series_list', [])
        series_names = chart_data.get('series_names', [])
        title = chart_data.get('title', '堆叠柱状图')
        
        if not categories or not series_list:
            logger.warning("堆叠柱状图的数据不完整")
            return
            
        # 创建底部位置
        bottoms = np.zeros(len(categories))
        
        # 绘制每个系列
        for i, series in enumerate(series_list):
            series_name = series_names[i] if i < len(series_names) else f"系列 {i+1}"
            plt.bar(categories, series, bottom=bottoms, label=series_name)
            bottoms += np.array(series)
        
        # 设置标题和轴标签
        plt.title(title)
        plt.xlabel(chart_data.get('x_label', '类别'))
        plt.ylabel(chart_data.get('y_label', '值'))
        
        # 添加图例
        plt.legend()
        
        # 旋转x轴标签以防止重叠
        plt.xticks(rotation=45, ha='right')
        
    def _create_scatter_plot(self, chart_data):
        """创建散点图"""
        x_values = chart_data.get('x_values', [])
        y_values = chart_data.get('y_values', [])
        colors = chart_data.get('colors', None)
        sizes = chart_data.get('sizes', None)
        title = chart_data.get('title', '散点图')
        
        if not x_values or not y_values:
            logger.warning("散点图的数据不完整")
            return
            
        # 绘制散点图
        plt.scatter(x_values, y_values, c=colors, s=sizes, alpha=0.7)
        
        # 设置标题和轴标签
        plt.title(title)
        plt.xlabel(chart_data.get('x_label', 'X轴'))
        plt.ylabel(chart_data.get('y_label', 'Y轴'))
        
        # 添加趋势线
        if chart_data.get('trend_line', False) and len(x_values) > 1:
            try:
                # 计算趋势线
                z = np.polyfit(x_values, y_values, 1)
                p = np.poly1d(z)
                
                # 添加趋势线
                x_trend = np.linspace(min(x_values), max(x_values), 100)
                plt.plot(x_trend, p(x_trend), "r--", alpha=0.8)
                
                # 显示拟合方程
                if chart_data.get('show_equation', False):
                    equation = f"y = {z[0]:.2f}x + {z[1]:.2f}"
                    plt.text(0.05, 0.95, equation, transform=plt.gca().transAxes, 
                             verticalalignment='top')
            except Exception as e:
                logger.warning(f"添加趋势线失败: {str(e)}")
        
    def _create_boxplot(self, chart_data):
        """创建箱线图"""
        data_series = chart_data.get('data_series', [])
        labels = chart_data.get('labels', [])
        title = chart_data.get('title', '箱线图')
        
        if not data_series:
            logger.warning("箱线图的数据为空")
            return
            
        # 绘制箱线图
        box = plt.boxplot(data_series, patch_artist=True, labels=labels)
        
        # 设置颜色
        colors = chart_data.get('colors', ['lightblue'] * len(data_series))
        for i, patch in enumerate(box['boxes']):
            color_idx = i % len(colors)
            patch.set(facecolor=colors[color_idx])
        
        # 设置标题和轴标签
        plt.title(title)
        plt.xlabel(chart_data.get('x_label', '类别'))
        plt.ylabel(chart_data.get('y_label', '值'))
        
        # 添加网格线
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        
    def _create_heatmap(self, chart_data):
        """创建热图"""
        data_matrix = chart_data.get('data_matrix', [])
        x_labels = chart_data.get('x_labels', [])
        y_labels = chart_data.get('y_labels', [])
        title = chart_data.get('title', '热图')
        
        if not data_matrix:
            logger.warning("热图的数据为空")
            return
            
        # 绘制热图
        cmap = chart_data.get('colormap', 'viridis')
        heatmap = plt.imshow(data_matrix, cmap=cmap)
        
        # 添加颜色条
        plt.colorbar(heatmap)
        
        # 设置标签
        if x_labels:
            plt.xticks(range(len(x_labels)), x_labels, rotation=45, ha='right')
        if y_labels:
            plt.yticks(range(len(y_labels)), y_labels)
        
        # 设置标题
        plt.title(title)
        
        # 在每个单元格中显示值
        if chart_data.get('show_values', False):
            for i in range(len(data_matrix)):
                for j in range(len(data_matrix[i])):
                    plt.text(j, i, f"{data_matrix[i][j]:.1f}", 
                             ha="center", va="center", color="white") 