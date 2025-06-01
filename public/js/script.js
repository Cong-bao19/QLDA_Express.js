// script.js
// Đây là file JavaScript chính để xử lý các chức năng trên giao diện ControlManage.html

console.log('script.js loaded successfully');

// Hàm để cập nhật thời gian hiện tại
function updateTime() {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString('vi-VN', {
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  document.getElementById('currentTime').innerHTML =
    `<li style='list-style-type: none; font-weight: bold; font-size: 14px;'>${formattedDate}</li>`;
}
setInterval(updateTime, 1000);
updateTime();

// Hàm để tải dữ liệu tình trạng đơn hàng
async function loadOrderStatus() {
  try {
    const response = await fetch('/api/order-status');
    const data = await response.json();
    const tableBody = document.querySelector('.custom-table tbody');
    tableBody.innerHTML = '';
    data.forEach(order => {
      const row = `<tr>
        <td>${order.orderId}</td>
        <td>${order.date}</td>
        <td>${order.totalmoney}</td>
        <td>${order.status}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu tình trạng đơn hàng:', error);
  }
}

// Hàm để tải tổng số đơn hàng
async function loadTotalOrders() {
  try {
    const response = await fetch('/api/total-orders');
    const data = await response.json();
    document.querySelector('.sumoforder li:nth-child(2)').textContent = `${data.total_orders} đơn hàng`;
  } catch (error) {
    console.error('Lỗi khi tải tổng số đơn hàng:', error);
  }
}

// Gọi các hàm khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  loadOrderStatus();
  loadTotalOrders();
});