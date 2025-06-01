console.log("newchart.js loaded successfully");

async function renderLineChart() {
  try {
    const response = await fetch("/api/first-6-months-orders", {
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        window.location.href = "/login.html";
        return;
      }
      throw new Error(`Lỗi khi lấy dữ liệu biểu đồ đường: ${response.status}`);
    }
    const data = await response.json();
    console.log("Dữ liệu nhận được từ API:", data);

    // Lọc dữ liệu hợp lệ
    const filteredData = data.filter((order) => {
      if (!order.date) return false;
      const parsedDate = new Date(order.date);
      return !isNaN(parsedDate.getTime());
    });

    console.log("Dữ liệu đã lọc:", filteredData);

    if (filteredData.length === 0) {
      document.getElementById("chart-error").style.display = "block";
      document.getElementById(
        "chart-error"
      ).textContent = `Hiện chưa có đơn hàng trong 6 tháng đầu năm ${new Date().getFullYear()}`;
      return;
    }

    // Chuyển đổi dữ liệu thành định dạng phù hợp với biểu đồ
    // Nhóm dữ liệu theo ngày và tính tổng
    const groupedData = {};

    filteredData.forEach((order) => {
      // Chỉ lấy phần ngày tháng năm, bỏ phần giờ
      const dateStr = order.date.split("T")[0];
      if (!groupedData[dateStr]) {
        groupedData[dateStr] = 0;
      }
      groupedData[dateStr] += order.totalmoney || 0;
    });

    // Chuyển đối tượng đã nhóm thành mảng cho biểu đồ
    const labels = Object.keys(groupedData).sort();
    const values = labels.map((date) => groupedData[date]);

    console.log("Labels:", labels);
    console.log("Values:", values);

    // Format nhãn ngày để hiển thị
    const formattedLabels = labels.map((dateStr) => {
      const parts = dateStr.split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    });

    const ctx = document.getElementById("canvas").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: formattedLabels,
        datasets: [
          {
            label: `Doanh thu theo ngày`,
            data: values,
            borderColor: "blue",
            backgroundColor: "rgba(0, 0, 255, 0.1)",
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Doanh thu (VNĐ)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Ngày",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Doanh thu: ${context.parsed.y.toLocaleString(
                  "vi-VN"
                )} VNĐ`;
              },
            },
          },
          title: {
            display: true,
            text: "Biểu đồ doanh thu theo ngày",
          },
        },
      },
    });

    document.getElementById("chart-error").style.display = "none";
  } catch (error) {
    console.error("Lỗi khi hiển thị biểu đồ đường:", error);
    document.getElementById("chart-error").style.display = "block";
    document.getElementById("chart-error").textContent =
      "Lỗi tải biểu đồ: " + error.message;
  }
}

async function renderBarChart() {
  try {
    console.log("Fetching data from /api/first-6-months-sales");
    const response = await fetch("/api/first-6-months-sales", {
      credentials: "include",
    });
    console.log(
      "Response status for /api/first-6-months-sales:",
      response.status
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.log("Redirecting to login due to 401/403");
        window.location.href = "/login.html";
        return;
      }
      throw new Error(`Lỗi khi lấy dữ liệu biểu đồ cột: ${response.status}`);
    }
    const data = await response.json();
    console.log("Data from /api/first-6-months-sales:", data);

    const year = new Date().getFullYear();
    console.log("Year used for bar chart:", year);

    // Tạo dữ liệu cho 6 tháng đầu năm
    const monthLabels = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
    ];
    const monthValues = Array(6).fill(0);

    // Điền dữ liệu từ API vào mảng
    if (data && data.length > 0) {
      data.forEach((item) => {
        const monthIndex = parseInt(item.month) - 1;
        if (monthIndex >= 0 && monthIndex < 6) {
          monthValues[monthIndex] = item.total_sales || 0;
        }
      });
    }

    console.log("Month labels:", monthLabels);
    console.log("Month values:", monthValues);

    const ctx = document.getElementById("barne").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: `Doanh thu ${year}`,
            data: monthValues,
            backgroundColor: "rgba(255, 165, 0, 0.7)",
            borderColor: "rgb(255, 165, 0)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Doanh thu (VNĐ)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Tháng",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Doanh thu: ${context.parsed.y.toLocaleString(
                  "vi-VN"
                )} VNĐ`;
              },
            },
          },
          title: {
            display: true,
            text: "Doanh thu theo tháng",
          },
        },
      },
    });

    if (!data || data.length === 0) {
      document.getElementById("bar-chart-error").style.display = "block";
      document.getElementById(
        "bar-chart-error"
      ).textContent = `Hiện chưa có doanh thu trong 6 tháng đầu năm ${year}`;
    } else {
      document.getElementById("bar-chart-error").style.display = "none";
    }
  } catch (error) {
    console.error("Lỗi khi hiển thị biểu đồ cột:", error);
    document.getElementById("bar-chart-error").style.display = "block";
    document.getElementById("bar-chart-error").textContent =
      "Lỗi tải biểu đồ: " + error.message;
  }
}
