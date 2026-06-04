from pathlib import Path
import sys

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.shared import Pt, RGBColor
from docx.text.paragraph import Paragraph


ACCENT = RGBColor(184, 148, 63)
TEXT = RGBColor(43, 40, 35)
MUTED = RGBColor(93, 86, 76)


def norm(text):
    return " ".join((text or "").split())


def iter_paragraphs(doc):
    for idx, paragraph in enumerate(doc.paragraphs):
        yield idx, paragraph, norm(paragraph.text)


def find_paragraph(doc, contains, start=0):
    contains_lower = contains.lower()
    for idx, paragraph, text in iter_paragraphs(doc):
        if idx >= start and contains_lower in text.lower():
            return idx, paragraph
    return None, None


def insert_paragraph_after(paragraph, text="", style=None):
    new_p = OxmlElement("w:p")
    paragraph._p.addnext(new_p)
    new_para = Paragraph(new_p, paragraph._parent)
    if style:
        new_para.style = style
    if text:
        new_para.add_run(text)
    return new_para


def insert_paragraph_before(paragraph, text="", style=None):
    new_para = paragraph.insert_paragraph_before(text)
    if style:
        new_para.style = style
    return new_para


def paragraph_after_chain(anchor, items, style="Normal"):
    current = anchor
    for text, kind in items:
        p = insert_paragraph_after(current, "", style=style)
        if kind == "heading":
            run = p.add_run(text)
            run.bold = True
            run.font.size = Pt(12)
            run.font.color.rgb = ACCENT
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
        elif kind == "note":
            run = p.add_run(text)
            run.italic = True
            run.font.color.rgb = MUTED
            p.paragraph_format.left_indent = Pt(18)
            p.paragraph_format.space_after = Pt(4)
        elif kind == "bullet":
            p.style = "List Paragraph"
            run = p.add_run(text)
            run.font.color.rgb = TEXT
            p.paragraph_format.space_after = Pt(2)
        else:
            run = p.add_run(text)
            run.font.color.rgb = TEXT
            p.paragraph_format.space_after = Pt(4)
        current = p
    return current


def replace_contains(doc, needle, replacement):
    _, paragraph = find_paragraph(doc, needle)
    if paragraph is not None:
        paragraph.text = replacement
    return paragraph


def add_table_after(doc, paragraph, rows):
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for r_idx, row_data in enumerate(rows):
        row = table.rows[r_idx]
        for c_idx, value in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            cell.text = value
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(0)
                for run in p.runs:
                    run.font.size = Pt(9)
                    if r_idx == 0:
                        run.bold = True
    paragraph._p.addnext(table._tbl)
    return table


def add_table_before(doc, paragraph, rows):
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for r_idx, row_data in enumerate(rows):
        row = table.rows[r_idx]
        for c_idx, value in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            cell.text = value
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(0)
                for run in p.runs:
                    run.font.size = Pt(9)
                    if r_idx == 0:
                        run.bold = True
    paragraph._p.addprevious(table._tbl)
    return table


def add_formatted_paragraph_after(anchor, text, kind="body", style="Normal"):
    return paragraph_after_chain(anchor, [(text, kind)], style=style)


def add_formatted_paragraph_before(anchor, text, kind="body", style="Normal"):
    p = insert_paragraph_before(anchor, "", style=style)
    if kind == "heading":
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = ACCENT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
    elif kind == "note":
        run = p.add_run(text)
        run.italic = True
        run.font.color.rgb = MUTED
        p.paragraph_format.left_indent = Pt(18)
        p.paragraph_format.space_after = Pt(4)
    else:
        run = p.add_run(text)
        run.font.color.rgb = TEXT
        p.paragraph_format.space_after = Pt(4)
    return p


def find_use_case_table(doc, use_case_name):
    for table in doc.tables:
        if len(table.rows) < 1 or len(table.columns) < 2:
            continue
        first_label = table_cell_text(table.rows[0].cells[0])
        first_value = table_cell_text(table.rows[0].cells[1])
        if first_label == "Tên UseCase" and first_value == use_case_name:
            return table
    return None




def table_cell_text(cell):
    return norm(" ".join(p.text for p in cell.paragraphs))


def set_cell(cell, text):
    cell.text = text
    for p in cell.paragraphs:
        p.paragraph_format.space_after = Pt(0)
        for run in p.runs:
            run.font.size = Pt(9)


def update_label_table(table, updates):
    for row in table.rows:
        label = table_cell_text(row.cells[0])
        if label in updates:
            set_cell(row.cells[1], updates[label])


def append_table_row(table, values):
    row = table.add_row()
    for idx, value in enumerate(values):
        set_cell(row.cells[idx], value)


def find_table_by_first_row(doc, expected):
    expected_norm = [norm(x) for x in expected]
    for table in doc.tables:
        if not table.rows:
            continue
        first = [table_cell_text(cell) for cell in table.rows[0].cells]
        if first[: len(expected_norm)] == expected_norm:
            return table
    return None


def main():
    if len(sys.argv) < 3:
        raise SystemExit("Usage: update_report_customer_features.py <input.docx> <output.docx>")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    doc = Document(input_path)

    # Danh muc hinh anh: add placeholders for new screenshots/diagrams.
    idx, anchor = find_paragraph(doc, "Hình 36. Mobile responsive – Booking")
    if anchor:
        paragraph_after_chain(anchor, [
            ("Hình 37. Trang đăng nhập khách hàng", "body"),
            ("Hình 38. Form đăng kí tài khoản khách hàng", "body"),
            ("Hình 39. Navbar hiển thị Xin chào khách hàng và menu tài khoản", "body"),
            ("Hình 40. Popup Tour đã đặt của khách hàng", "body"),
            ("Hình 41. Lược đồ bổ sung bảng customer_accounts", "body"),
            ("Hình 42. Luồng xác thực trước khi đặt tour", "body"),
        ])

    # High-level objective and scope.
    _, anchor = find_paragraph(doc, "Xây dựng chức năng gửi email xác nhận đặt tour")
    if anchor:
        paragraph_after_chain(anchor, [
            ("Xây dựng chức năng đăng kí và đăng nhập tài khoản khách hàng. Khách hàng phải đăng nhập trước khi tạo booking; nếu chưa đăng nhập, hệ thống chuyển hướng sang trang đăng nhập.", "bullet"),
            ("Bổ sung menu tài khoản khách hàng trên thanh điều hướng, hiển thị lời chào theo tên khách hàng, cho phép xem danh sách tour đã đặt và đăng xuất khỏi hệ thống.", "bullet"),
        ])

    # Actors table.
    if len(doc.tables) > 1:
        set_cell(doc.tables[1].rows[1].cells[2], "Người dùng cuối – có thể xem tour, đăng kí/đăng nhập tài khoản, đặt tour sau khi đăng nhập, xem danh sách tour đã đặt và đăng xuất.")

    # Customer role section.
    _, anchor = find_paragraph(doc, "Nhận mã booking sau khi đặt tour thành công")
    if anchor:
        paragraph_after_chain(anchor, [
            ("Đăng kí tài khoản khách hàng bằng tên, email và mật khẩu.", "bullet"),
            ("Đăng nhập để được phép đặt tour; hệ thống lưu token đăng nhập trên trình duyệt trong localStorage.", "bullet"),
            ("Xem menu tài khoản với lời chào \"Xin chào + tên khách hàng\" ở góc phải thanh điều hướng.", "bullet"),
            ("Xem danh sách các tour đã đặt thông qua mục \"Tour đã đặt\" và có thể đăng xuất khỏi website.", "bullet"),
        ])

    _, anchor = find_paragraph(doc, "Xác thực token đăng nhập của quản trị viên")
    if anchor:
        paragraph_after_chain(anchor, [
            ("Xác thực token đăng nhập của khách hàng trước khi cho phép gửi yêu cầu đặt tour.", "bullet"),
            ("Lưu tài khoản khách hàng vào bảng customer_accounts và dùng email tài khoản để truy xuất danh sách tour đã đặt.", "bullet"),
        ])

    # Technical overview / component descriptions.
    replace_contains(
        doc,
        "Khách hàng không cần đăng ký tài khoản",
        "– Khách du lịch (Customer): Có thể duyệt 9 tour, lọc theo danh mục, xem chi tiết từng tour kèm hình ảnh, lịch trình, giá và đặt tour ngay trên website. Từ phiên bản hiện tại, khách hàng cần đăng kí/đăng nhập tài khoản trước khi đặt tour. Sau khi đăng nhập, navbar hiển thị lời chào theo tên khách hàng và cho phép xem lại các tour đã đặt."
    )

    _, anchor = find_paragraph(doc, "Form đặt tour (Booking Form)")
    if anchor:
        paragraph_after_chain(anchor, [
            ("– Tài khoản khách hàng (Customer Auth): Gồm trang login.html với hai chế độ đăng nhập và đăng kí. Form đăng kí thu thập tên khách hàng, email và mật khẩu. Sau khi đăng kí thành công, khách hàng phải đăng nhập lại trước khi đặt tour.", "body"),
            ("– Menu khách hàng (Customer Menu): Sau khi đăng nhập, script customer-nav.js thêm mục \"Xin chào + tên khách hàng\" vào navbar. Dropdown cung cấp hai chức năng: \"Tour đã đặt\" và \"Đăng xuất\".", "body"),
            ("– Tour đã đặt: Frontend gọi GET /api/customer-bookings kèm Authorization token để lấy danh sách booking theo email tài khoản đang đăng nhập, sau đó hiển thị trong popup trên giao diện.", "body"),
        ])

    # Use case overview.
    _, anchor = find_paragraph(doc, "– Nhận mail đặt tour thành công")
    if anchor:
        paragraph_after_chain(anchor, [
            ("– Đăng kí tài khoản khách hàng", "body"),
            ("– Đăng nhập khách hàng", "body"),
            ("– Xem tour đã đặt", "body"),
            ("– Đăng xuất", "body"),
        ])

    # Insert new use case subsection before current booking use case.
    _, anchor = find_paragraph(doc, "3.3.3 Đặt tour")
    if anchor:
        add_formatted_paragraph_before(anchor, "3.3.3 Chức năng đăng kí/đăng nhập khách hàng", "heading")
        add_formatted_paragraph_before(anchor, "Chức năng này cho phép khách hàng tạo tài khoản bằng tên, email và mật khẩu. Khi đăng kí thành công, hệ thống không tự động đăng nhập mà yêu cầu khách hàng đăng nhập lại. Sau khi đăng nhập, token khách hàng được lưu ở localStorage và được gửi kèm các request cần xác thực.", "body")
        add_formatted_paragraph_before(anchor, "Bảng 4a. Mô tả Use Case Đăng kí/Đăng nhập khách hàng", "body")
        add_table_before(doc, anchor, [
            ["Thuộc tính", "Mô tả"],
            ["Tên UseCase", "Đăng kí/Đăng nhập khách hàng"],
            ["Tác nhân", "Customer"],
            ["Mô tả", "Khách hàng tạo tài khoản, đăng nhập và nhận token để sử dụng các chức năng đặt tour, xem tour đã đặt."],
            ["Tiền điều kiện", "Khách hàng truy cập login.html hoặc được chuyển hướng từ nút Đặt Tour khi chưa đăng nhập."],
            ["Luồng chính", "1. Khách chọn Đăng kí ngay. 2. Nhập tên, email, mật khẩu. 3. Hệ thống lưu customer_accounts. 4. Khách đăng nhập bằng email/mật khẩu. 5. Hệ thống tạo token và trả về thông tin khách hàng."],
            ["Luồng phụ", "Nếu email đã tồn tại, mật khẩu quá ngắn hoặc sai thông tin đăng nhập, hệ thống trả thông báo lỗi."],
            ["Hậu điều kiện", "Khách hàng đã có token đăng nhập, navbar hiển thị lời chào theo tên khách hàng."],
        ])
        add_formatted_paragraph_before(anchor, "3.3.4 Chức năng xem tour đã đặt và đăng xuất", "heading")
        add_formatted_paragraph_before(anchor, "Khi khách hàng đã đăng nhập, hệ thống thêm menu tài khoản ở góc phải thanh điều hướng. Khi bấm vào lời chào, dropdown hiển thị mục Tour đã đặt và Đăng xuất. Mục Tour đã đặt gọi API /api/customer-bookings để lấy các booking tương ứng với email tài khoản; mục Đăng xuất xoá token và thông tin khách hàng khỏi localStorage.", "body")
        add_formatted_paragraph_before(anchor, "Bảng 4b. Mô tả Use Case Xem tour đã đặt", "body")
        add_table_before(doc, anchor, [
            ["Thuộc tính", "Mô tả"],
            ["Tên UseCase", "Xem tour đã đặt"],
            ["Tác nhân", "Customer"],
            ["Mô tả", "Khách hàng xem lại danh sách booking đã tạo sau khi đăng nhập."],
            ["Tiền điều kiện", "Khách hàng đã đăng nhập và có token hợp lệ."],
            ["Luồng chính", "1. Khách bấm Xin chào + tên. 2. Chọn Tour đã đặt. 3. Frontend gọi GET /api/customer-bookings. 4. Hệ thống trả danh sách tour đã đặt. 5. Popup hiển thị mã booking, tên tour, ngày đi, trạng thái, số khách và tổng tiền."],
            ["Luồng phụ", "Nếu token hết hạn, hệ thống xoá token cũ và yêu cầu đăng nhập lại. Nếu chưa có booking, popup hiển thị thông báo chưa đặt tour nào."],
            ["Hậu điều kiện", "Khách hàng xem được lịch sử đặt tour của tài khoản hiện tại."],
        ])

    # Existing booking use case table.
    booking_table = find_use_case_table(doc, "Đặt tour")
    if booking_table:
        update_label_table(booking_table, {
            "Mô tả": "Khách hàng đã đăng nhập điền form và đặt tour. Nếu chưa đăng nhập, hệ thống chuyển hướng sang trang đăng nhập trước khi cho phép đặt tour.",
            "Tiền điều kiện": "Khách hàng đang ở trang booking.html của một tour cụ thể và có token đăng nhập hợp lệ.",
            "Luồng chính": "1. Khách hàng đăng nhập. 2. Chọn tour/ngày khởi hành. 3. Nhập số điện thoại, ghi chú và số lượng khách; email được lấy theo tài khoản đăng nhập. 4. Frontend gửi POST /api/bookings kèm Authorization: Bearer token. 5. Backend xác thực token, lưu customer/booking, gửi email xác nhận và trả booking_id, total_price.",
            "Luồng phụ": "Nếu token thiếu hoặc hết hạn, hệ thống xoá token cũ và chuyển khách về login.html. Nếu dữ liệu không hợp lệ hoặc ngày đã khoá/hết chỗ, hệ thống thông báo lỗi.",
        })

    # ERD / database design.
    _, anchor = find_paragraph(doc, "Bảng blocked_dates lưu các ngày bị khóa toàn bộ")
    if anchor:
        paragraph_after_chain(anchor, [
            ("Bổ sung bảng customer_accounts để lưu tài khoản đăng nhập của khách hàng. Bảng này gồm full_name, email, password, token, token_exp và created_at. Email có ràng buộc UNIQUE để mỗi tài khoản chỉ dùng một email.", "body"),
            ("Trong phiên bản hiện tại, bảng customers vẫn lưu thông tin liên hệ trong từng booking, còn customer_accounts lưu thông tin xác thực. Khi khách hàng xem \"Tour đã đặt\", hệ thống dùng email tài khoản đăng nhập để truy xuất các booking có cùng email trong bảng customers.", "body"),
            ("[GHI CHÚ CẦN THÊM LƯỢC ĐỒ] Cập nhật Hình 8/Lược đồ CSDL bằng cách thêm bảng customer_accounts và thể hiện liên kết nghiệp vụ customer_accounts.email -> customers.email để mô tả chức năng xem tour đã đặt.", "note"),
        ])

    # Booking/auth flow.
    replace_contains(
        doc,
        "2. Gửi request: Frontend gọi POST /api/bookings",
        "2. Kiểm tra đăng nhập: Nếu chưa có hue_customer_token trong localStorage, booking.html chuyển hướng sang login.html?redirect=booking.html?tour=X. Sau khi đăng nhập thành công, khách hàng quay lại đúng tour đang đặt."
    )
    _, anchor = find_paragraph(doc, "2. Kiểm tra đăng nhập:")
    if anchor:
        paragraph_after_chain(anchor, [
            ("3. Gửi request: Frontend gọi POST /api/bookings với body JSON gồm thông tin khách hàng, tour_id, departure_date, num_adults, num_children, num_infants và header Authorization: Bearer {customer_token}.", "body"),
            ("4. Xác thực token khách hàng: Backend kiểm tra token trong bảng customer_accounts; nếu token thiếu hoặc hết hạn thì trả lỗi 401.", "body"),
        ])
    replace_contains(doc, "5. Insert customer:", "5. Insert customer: Nếu khách hàng mới (chưa có trong DB theo SĐT), insert vào bảng customers. Nếu đã có (cùng SĐT), dùng lại customer_id cũ.")
    _, anchor = find_paragraph(doc, "9. Frontend hiển thị:")
    if anchor:
        paragraph_after_chain(anchor, [
            ("[GHI CHÚ CẦN THÊM LƯỢC ĐỒ] Cập nhật Hình 9/Luồng xử lý đặt tour bằng bước kiểm tra token khách hàng trước khi gửi/lưu booking.", "note"),
        ])

    # Implementation sections.
    _, anchor = find_paragraph(doc, "+ Form Đặt Tour")
    if anchor:
        paragraph_after_chain(anchor, [
            ("4.3.2.1 Trang đăng nhập/đăng kí khách hàng (login.html)", "heading"),
            ("Trang login.html sử dụng giao diện tương đồng với form đăng nhập admin nhưng dành cho khách hàng. Form đăng nhập gồm email và mật khẩu. Bên dưới nút Đăng Nhập có dòng \"Bạn chưa có tài khoản? Đăng kí ngay\" để chuyển sang form đăng kí. Form đăng kí gồm tên khách hàng, email, mật khẩu và nút Đăng Kí.", "body"),
            ("Sau khi đăng kí thành công, hệ thống hiển thị thông báo yêu cầu khách hàng đăng nhập lại. Khi đăng nhập thành công, frontend lưu hue_customer_token, hue_customer_name và hue_customer_email vào localStorage rồi chuyển khách về trang đặt tour ban đầu.", "body"),
            ("[GHI CHÚ CẦN THÊM ẢNH] Chèn ảnh minh họa login.html ở trạng thái đăng nhập và trạng thái đăng kí.", "note"),
            ("4.3.2.2 Menu tài khoản khách hàng (customer-nav.js)", "heading"),
            ("File customer-nav.js chịu trách nhiệm bảo vệ các link đặt tour trên trang chủ, thêm mục \"Xin chào + tên khách hàng\" vào navbar khi đã đăng nhập, hiển thị dropdown với hai mục \"Tour đã đặt\" và \"Đăng xuất\".", "body"),
            ("Khi chọn Tour đã đặt, script mở popup và gọi GET /api/customer-bookings để lấy danh sách booking theo email tài khoản. Khi chọn Đăng xuất, script xoá token và thông tin khách hàng khỏi localStorage rồi chuyển về trang chủ.", "body"),
            ("[GHI CHÚ CẦN THÊM ẢNH] Chèn ảnh navbar sau đăng nhập, dropdown tài khoản và popup Tour đã đặt.", "note"),
        ])

    _, anchor = find_paragraph(doc, "Trong trường hợp email không gửi được")
    if anchor:
        paragraph_after_chain(anchor, [
            ("4.3.9 API xác thực và lịch sử đặt tour của khách hàng", "heading"),
            ("Các API mới gồm POST /api/customer-register, POST /api/customer-login và GET /api/customer-bookings. API đăng kí kiểm tra dữ liệu bắt buộc, định dạng email, độ dài mật khẩu và email trùng. API đăng nhập kiểm tra email/mật khẩu, tạo token và hạn token 24 giờ. API tour đã đặt yêu cầu Authorization: Bearer token, sau đó trả về các booking tương ứng với email tài khoản đang đăng nhập.", "body"),
            ("API /api/bookings cũng được cập nhật để yêu cầu token khách hàng trước khi tạo booking. Điều này đảm bảo khách chưa đăng nhập không thể đặt tour trực tiếp bằng request API.", "body"),
        ])

    # UI screenshots section placeholders.
    _, anchor = find_paragraph(doc, "Sau khi đặt thành công, ẩn form và hiển thị trang Success")
    if anchor:
        paragraph_after_chain(anchor, [
            ("4.4.13.1 Trang đăng nhập khách hàng", "heading"),
            ("Hình 37. Trang đăng nhập khách hàng", "body"),
            ("[GHI CHÚ CẦN THÊM ẢNH] Chèn ảnh màn hình login.html với form đăng nhập khách hàng.", "note"),
            ("4.4.13.2 Form đăng kí khách hàng", "heading"),
            ("Hình 38. Form đăng kí tài khoản khách hàng", "body"),
            ("[GHI CHÚ CẦN THÊM ẢNH] Chèn ảnh form đăng kí gồm tên khách hàng, email, mật khẩu và nút Đăng Kí.", "note"),
            ("4.4.13.3 Menu tài khoản và Tour đã đặt", "heading"),
            ("Hình 39. Navbar hiển thị Xin chào khách hàng và menu tài khoản", "body"),
            ("Hình 40. Popup Tour đã đặt của khách hàng", "body"),
            ("[GHI CHÚ CẦN THÊM ẢNH] Chèn ảnh dropdown có Tour đã đặt/Đăng xuất và popup danh sách booking.", "note"),
        ])

    # API endpoint table.
    api_table = find_table_by_first_row(doc, ["Endpoint", "Method", "Chức năng"])
    if api_table:
        append_table_row(api_table, ["/api/customer-register", "POST", "Đăng kí tài khoản khách hàng bằng tên, email và mật khẩu."])
        append_table_row(api_table, ["/api/customer-login", "POST", "Đăng nhập khách hàng, tạo token và trả về tên/email để hiển thị trên navbar."])
        append_table_row(api_table, ["/api/customer-bookings", "GET", "Lấy danh sách tour đã đặt của khách hàng đang đăng nhập; yêu cầu Authorization token."])

    # Test/evaluation table.
    test_table = find_table_by_first_row(doc, ["Tính năng", "Trạng thái", "Mô tả"])
    if test_table:
        append_table_row(test_table, ["Đăng kí tài khoản khách hàng", "Đạt", "Khách hàng nhập tên, email, mật khẩu; hệ thống kiểm tra email trùng và lưu vào customer_accounts."])
        append_table_row(test_table, ["Đăng nhập khách hàng", "Đạt", "Đăng nhập bằng email/mật khẩu, nhận token và hiển thị lời chào trên navbar."])
        append_table_row(test_table, ["Chặn đặt tour khi chưa đăng nhập", "Đạt", "Bấm Đặt Tour khi chưa đăng nhập sẽ chuyển sang login.html và quay lại trang booking sau khi đăng nhập."])
        append_table_row(test_table, ["Xem tour đã đặt", "Đạt", "Dropdown Xin chào -> Tour đã đặt hiển thị danh sách booking theo email tài khoản."])
        append_table_row(test_table, ["Đăng xuất khách hàng", "Đạt", "Xoá token/thông tin khách hàng khỏi localStorage và trở về trang chủ."])

    # Update limitations / future direction.
    replace_contains(
        doc,
        "+ Có thêm chức năng đăng nhập bằng Google / Facebook",
        "+ Nâng cấp đăng nhập bằng Google / Facebook để khách hàng đăng nhập nhanh hơn, thay vì chỉ dùng email và mật khẩu nội bộ. + Có chức năng đánh giá / review tour từ khách hàng cũ. + Có thêm thanh toán online (VNPay, Momo) để hoàn tất giao dịch ngay lập tức. + Có chatbot hỗ trợ khách hàng trực tuyến."
    )
    replace_contains(
        doc,
        "Tích hợp đăng nhập bằng Google / Facebook: Cho phép khách hàng đăng nhập nhanh bằng tài khoản mạng xã hội, lưu lịch sử đặt tour, theo dõi trạng thái đơn hàng.",
        "Nâng cấp đăng nhập bằng Google / Facebook: Hệ thống hiện đã có tài khoản khách hàng nội bộ bằng email/mật khẩu. Trong tương lai có thể tích hợp Google/Facebook OAuth để đăng nhập nhanh và tăng trải nghiệm người dùng."
    )
    replace_contains(
        doc,
        "Đã hiện thực hoá đầy đủ các chức năng: xem tour, lọc tour",
        "– Đã hiện thực hoá đầy đủ các chức năng: xem tour, lọc tour, xem chi tiết tour kèm calendar lịch khởi hành, đăng kí/đăng nhập khách hàng, chặn đặt tour khi chưa đăng nhập, đặt tour với form đầy đủ, xem trước giá tự cập nhật, gửi email xác nhận đặt tour, xem tour đã đặt và đăng xuất. Trang admin có dashboard, quản lý booking, quản lý lịch/khoá ngày và thống kê."
    )

    # Appendix endpoints text.
    _, anchor = find_paragraph(doc, "`POST /api/bookings`")
    if anchor:
        paragraph_after_chain(anchor, [
            ("`POST /api/customer-register` – Body: { full_name, email, password }. Tạo tài khoản khách hàng trong bảng customer_accounts.", "body"),
            ("`POST /api/customer-login` – Body: { email, password }. Trả về token, full_name và email của khách hàng.", "body"),
            ("`GET /api/customer-bookings` – Header Authorization: Bearer {token}. Trả về danh sách booking của khách hàng đang đăng nhập.", "body"),
        ])

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(output_path)


if __name__ == "__main__":
    main()
