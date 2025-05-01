const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ChartService {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: this.width,
      height: this.height,
      backgroundColour: 'white'
    });
  }
  
  /**
   * Create a pie chart for expense categories
   * @param {Object} categoryTotals - Object with categories and their total amounts
   * @param {string} title - Chart title
   * @returns {Promise<string>} - Path to the saved chart image
   */
  async createPieChart(categoryTotals, title) {
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    // Generate colors based on the number of categories
    const colors = this._generateColors(labels.length);
    
    const configuration = {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = ((value * 100) / total).toFixed(1);
                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    return this._saveChart(configuration);
  }
  
  /**
   * Create a bar chart for expense comparison
   * @param {Object} data - Data for the chart (labels and values)
   * @param {string} title - Chart title
   * @param {string} xAxisLabel - X-axis label
   * @param {string} yAxisLabel - Y-axis label
   * @returns {Promise<string>} - Path to the saved chart image
   */
  async createBarChart(data, title, xAxisLabel, yAxisLabel) {
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    const configuration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: yAxisLabel,
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: xAxisLabel
            }
          },
          y: {
            title: {
              display: true,
              text: yAxisLabel
            },
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: 16
            }
          },
          legend: {
            display: false
          }
        }
      }
    };
    
    return this._saveChart(configuration);
  }
  
  /**
   * Generate random colors for chart segments
   * @param {number} count - Number of colors to generate
   * @returns {Array} - Array of color strings
   */
  _generateColors(count) {
    const baseColors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(40, 199, 111, 0.8)',
      'rgba(205, 132, 241, 0.8)'
    ];
    
    // If we need more colors than in our base array, generate them
    const colors = [...baseColors];
    
    while (colors.length < count) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
    }
    
    return colors.slice(0, count);
  }
  
  /**
   * Save chart to a temporary file
   * @param {Object} configuration - Chart.js configuration
   * @returns {Promise<string>} - Path to the saved chart image
   */
  async _saveChart(configuration) {
    try {
      const buffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
      
      // Create a temporary file
      const tempDir = os.tmpdir();
      const fileName = `chart-${Date.now()}.png`;
      const filePath = path.join(tempDir, fileName);
      
      // Write the buffer to file
      fs.writeFileSync(filePath, buffer);
      
      return filePath;
    } catch (error) {
      console.error('Error creating chart:', error);
      throw error;
    }
  }
}

module.exports = new ChartService();