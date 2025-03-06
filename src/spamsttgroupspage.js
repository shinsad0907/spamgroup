document.addEventListener("DOMContentLoaded", function (e) {
  const selectAllCheckbox = document.getElementById(
    "selectAllCheckboxmanagerpage"
  );
  const modalHTML = `
  <div class="modal-overlay" id="statusModal" style="display: none;">
      <div class="modal">
          <div class="modal-header">
              <h2 class="modal-title">Tạo Status</h2>
          </div>
          <div class="modal-body">
              <div class="input-group">
                  <textarea id="statusContentInput" class="text-input" placeholder="Nhập nội dung status của bạn vào đây..." rows="4"></textarea>
              </div>
              <div class="input-group" style="margin-top: 16px;">
                  <label for="mediaFileInput" class="file-input-label" style="
                      padding: 8px 16px;
                      background: #0066cc;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      gap: 5px;
                      font-size: 14px;
                      min-width: 90px;
                  ">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      Chọn ảnh/video
                  </label>
                  <input type="file" id="mediaFileInput" accept="image/*, video/*" style="display: none;" />
              </div>
              <div id="mediaPreview" style="margin-top: 16px; display: none;">
                  <img id="previewImage" src="#" alt="Preview" style="max-width: 100%; max-height: 200px; display: none;" />
                  <video id="previewVideo" controls style="max-width: 100%; max-height: 200px; display: none;"></video>
              </div>
          </div>
          <div class="modal-footer">
              <button class="btn-primary" id="postStatusBtn">Đăng</button>
          </div>
      </div>
  </div>

  <style>
      .file-input-label:hover {
          background: #0052a3 !important;
      }
      .file-input-label:active {
          background: #004080 !important;
      }
  </style>
`;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  const mediaFileInput = document.getElementById("mediaFileInput");
  const mediaPreview = document.getElementById("mediaPreview");
  const previewImage = document.getElementById("previewImage");
  const previewVideo = document.getElementById("previewVideo");
  const statusContentInput = document.getElementById("statusContentInput");
  const resultsTbody = document.getElementById("results-tbody-content");

  async function loadAccountGroups(selectedGroup = "all") {
    const filePath = path.join(__dirname, "data", "sweep_page.json");

    try {
      if (!fs.existsSync(filePath)) {
        // Khởi tạo trạng thái rỗng nếu file không tồn tại
        // initializeEmptyState();
        console.warn("File không tồn tại, khởi tạo trạng thái mặc định.");
        return;
      }

      const fileData = fs.readFileSync(filePath, "utf-8");
      let groups = JSON.parse(fileData);

      // Kiểm tra dữ liệu trong file JSON
      if (!Array.isArray(groups)) {
        console.error("Dữ liệu trong file không hợp lệ, phải là một mảng.");
        // initializeEmptyState();
        return;
      }

      console.log("Danh sách nhóm tài khoản:", groups);

      // Cập nhật danh sách nhóm trong select element
      updateGroupSelect(groups);

      let allAccounts = [];
      if (selectedGroup === "all") {
        // Lấy tất cả tài khoản từ tất cả nhóm
        allAccounts = groups.flatMap((group) => group.data || []);
      } else {
        // Lọc các tài khoản theo nhóm đã chọn
        const selectedGroupData = groups.find(
          (group) => group.name_groups === selectedGroup
        );
        if (selectedGroupData) {
          allAccounts = selectedGroupData.data || [];
        }
      }

      // Gọi các hàm render giao diện nếu cần
      renderAccountsTable(allAccounts);
      // updateStats(allAccounts);
    } catch (error) {
      console.error("Error loading groups:", error);
      // initializeEmptyState();
    }
  }
  function updateGroupSelect(groups) {
    const selects = [
      document.getElementById("scanGroupsSelectspamgroups"),
      // Add other select elements here if necessary
      // document.getElementById("scanGroupsSelect"),
    ];

    selects.forEach((select) => {
      if (!select) return;

      // Lưu giá trị đang được chọn
      const currentValue = select.value;

      // Xóa các tùy chọn hiện tại
      select.innerHTML = "";

      // Thêm tùy chọn mặc định
      const defaultText =
        select.id === "scanGroupsSelectspamgroups"
          ? "Tất cả tài khoản"
          : "Chọn danh mục tài khoản quét";
      select.appendChild(new Option(defaultText, "all"));

      // Thêm các nhóm từ danh sách `groups`
      groups.forEach((group) => {
        if (group && group.name_groups) {
          const option = new Option(group.name_groups, group.name_groups);
          select.appendChild(option);
        }
      });

      // Khôi phục giá trị đã chọn nếu giá trị đó vẫn tồn tại
      const optionExists = Array.from(select.options).some(
        (option) => option.value === currentValue
      );
      if (optionExists) {
        select.value = currentValue;
      } else {
        select.value = "all"; // Mặc định về "all" nếu không tồn tại
      }
    });
  }
  function renderAccountsTable(accounts) {
    let id = 0;
    const resultsTbody = document.getElementById("results-tbody-spam-groups");
    resultsTbody.innerHTML = "";

    if (!accounts || accounts.length === 0) {
      resultsTbody.innerHTML = `        
          <tr>
            <td colspan="6" style="text-align: center; padding: 20px;">
              Chưa có tài khoản nào. Vui lòng thêm tài khoản mới.
            </td>
          </tr>
        `;
      return;
    }

    accounts.forEach((account) => {
      id++;

      // Tạo một dòng mới để hiển thị tài khoản
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td><input type="checkbox" class="checkboxmanagerpage" /></td>
          <td>${id}</td>
          <td title="${account.name_page || ""}">
        ${
          account.name_page && account.name_page.length > 20
            ? account.name_page.slice(0, 20) + "..."
            : account.name_page || ""
        }
        </td>
          <td>${account.uid_page || ""}</td>
          <td title="${account.cookie_page || ""}">
        ${
          account.cookie_page && account.cookie_page.length > 20
            ? account.cookie_page.slice(0, 20) + "..."
            : account.cookie_page || ""
        }
        </td>
        `;
      resultsTbody.appendChild(tr);
    });
  }

  document
    .getElementById("btn-select-content")
    .addEventListener("click", function (e) {
      document.getElementById("select-content").style.display = "flex";
    });
  document
    .getElementById("close-select-content")
    .addEventListener("click", function (e) {
      document.getElementById("select-content").style.display = "none";
    });
  document
    .getElementById("scanGroupsSelectspamgroups")
    .addEventListener("change", function () {
      const selectedGroup = this.value;
      console.log("Nhóm đã chọn:", selectedGroup);
      loadAccountGroups(selectedGroup); // Gọi lại hàm để tải tài khoản theo nhóm đã chọn
    });
  document
    .getElementById("bnt-add-groups-content")
    .addEventListener("click", function () {
      document.getElementById("save-chosse-content").style.display = "none";
      document.getElementById(
        "save-chosse-content-or-groups-content"
      ).style.display = "flex";
      const resultsTbody = document.getElementById("results-tbody-content");
      while (resultsTbody.firstChild) {
        resultsTbody.removeChild(resultsTbody.firstChild);
      }
    });
  document
    .getElementById("bnt-add-content")
    .addEventListener("click", function () {
      document.getElementById("statusModal").style.display = "flex";
      mediaFileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            if (file.type.startsWith("image/")) {
              previewImage.src = e.target.result;
              previewImage.style.display = "block";
              previewVideo.style.display = "none";
            } else if (file.type.startsWith("video/")) {
              previewVideo.src = e.target.result;
              previewVideo.style.display = "block";
              previewImage.style.display = "none";
            }
            mediaPreview.style.display = "block";
          };
          reader.readAsDataURL(file);
        }
      });
    });
  document
    .getElementById("postStatusBtn")
    .addEventListener("click", async function () {
      const statusContent = statusContentInput.value.trim();
      const file = mediaFileInput.files[0];
      // Đường dẫn đến thư mục 'content'
      const contentDir = path.join(__dirname, "content");

      // Đảm bảo thư mục 'content' tồn tại
      if (!fs.existsSync(contentDir)) {
        fs.mkdirSync(contentDir, { recursive: true });
      }
      if (!statusContent || !file) {
        alert("Vui lòng nhập nội dung và chọn ảnh/video!");
        return;
      }

      try {
        // Tạo tên file duy nhất để tránh ghi đè
        const timestamp = Date.now();
        const fileExtension = path.extname(file.name);
        const fileName = `media-${timestamp}${fileExtension}`;
        const filePath = path.join(contentDir, fileName);

        // Đọc file từ input và ghi vào thư mục 'content'
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const arrayBuffer = fileReader.result;
          const buffer = Buffer.from(arrayBuffer);

          // Ghi file vào thư mục 'content'
          fs.writeFileSync(filePath, buffer);

          console.log("Đường dẫn file:", filePath);
          console.log("Nội dung status:", statusContent);
          const row = document.createElement("tr");
          row.innerHTML = `
                    <td><input type="checkbox" class="checkboxscan" /></td>
                    <td>${""}</td>
                    <td>${statusContent}</td>
                    <td>${filePath}</td>
                `;

          // Thêm dòng mới vào bảng
          resultsTbody.appendChild(row);
          alert("Đăng status thành công!");
          document.getElementById("statusModal").style.display = "none";
        };

        fileReader.onerror = (error) => {
          console.error("Lỗi khi đọc file:", error);
          alert("Có lỗi xảy ra khi đọc file!");
        };

        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Lỗi khi xử lý file:", error);
        alert("Có lỗi xảy ra khi xử lý file!");
      }
    });
  // Tải dữ liệu nhóm và cập nhật giao diện ban đầu
  loadAccountGroups();
});
