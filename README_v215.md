# TRIUMPH Pilot Trainer v215

基準：GitHub main v214，commit `09b727bdeba7e6da20abe7471e8c16bf6b6ece72`。
校正日期：2026-09-18。

## 本次內容

- 重寫「你如何看待你的老闆或上司」與「你對天合聯盟了解多少」，同步對應英文答案及中文翻譯。
- 面試答案移除不切題的制式段落，補足具體觀點；未確認的個人經驗不捏造事件或結果。
- 英文選項及英文解析中的中文漏譯改為英文；保留中文解析。
- 中文題只顯示一份中文答案，不再顯示空白或重複的中文翻譯區；Daily Test 同步處理。Classical CN 保留原文閱讀及自己的解答排版。
- 華航機隊更新為官方 2026-08-31 統計：84 架（66 客機、18 貨機）。長榮保留可確認的官方 2026-08-01 統計 89 架，不將未交付訂單計入現役。星宇補上已於 2026-08-01 開航的台北—布拉格航線；31 架明確限於年報的 2026-03 時點，43 架為年底計畫，不宣稱是今日實際數量。
- NOTAM 說明現行 FAA 名稱及 2025-02-10 恢復命名；ETOPS 區分現行 FAA Extended Operations 與歷史雙發動機用語。
- 沒有全域取代 IAS；航空知識題的 IAS 題目、主要答案及中文解析保持原內容。飛行記憶訓練指令產生程式沒有改動。

## 檢查範圍

對全部 4,192 筆執行結構與語言掃描，檢查答案空白、英文題中文解析缺漏、英文選項混入中文、選項索引及執行錯誤。針對圖片兩題、掃描發現的語言問題、相關面試題與航空公司／縮寫時效資料做重點內容校正。精確變更清單及數量見 `v215-change-report.json`。

此為全庫自動掃描加重點人工校正，不代表每一題的每個事實與推導都已由官方逐字重新認證。題庫是甄試練習材料，不取代現行飛航手冊、核准程序或教官指導。個人面試範例使用既有題庫中的背景，正式面試仍應核對自身真實經驗。

## 可追溯來源

- 華航官方營運機隊：https://www.china-airlines.com/us/zh/about-china-airlines/about-us/operations
- 長榮官方機隊：https://www.evaair.com/en-hk/about-eva-air/about-us/market-and-sales-overview/eva-air-fleet/
- 星宇官方機隊：https://www.starlux-airlines.com/en-Global/experience/walk-into-starlux/our-fleet
- 星宇布拉格開航公告：https://latestnews.starlux-airlines.com/en-TH/about-us/travel-advisories/advisories/latest-news/fly_to_PRG
- 布拉格機場實際開航公告：https://www.prg.aero/en/starlux-airlines-makes-its-debut-europe-new-direct-service-connects-prague-taipei-today
- SkyTeam 歷史：https://www.skyteam.com/en/about/history/
- SkyTeam 會員計畫：https://www.skyteam.com/en/frequent-flyers/programs/
- 華航聯盟會員規則：https://www.china-airlines.com/tw/zh/member/planning/partners.html
- FAA NOTAM：https://www.faa.gov/about/initiatives/notam/what_is_a_notam
- FAA ETOPS AC 120-42B：https://www.faa.gov/regulations_policies/advisory_circulars/index.cfm/go/document.information/documentid/73587

## GitHub 更新方式

將本包的 `index.html`、`sw.js` 與 `version.json` 一起更新到既有儲存庫根目錄；其餘圖示及 manifest 不用刪除。README 與兩份 QA／變更 JSON 可一併保留供核對。完整 HTML 另提供 `TRIUMPH_Pilot_Trainer_v215.html`。

Service Worker 只遞增快取名稱至 v215，保留既有網路優先策略。更新後請重新開啟網站並確認標題 v215；若裝置仍停留舊版，先關閉其他舊分頁再重新整理，不必刪除練習紀錄。
