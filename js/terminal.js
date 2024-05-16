root = "https://terminal.tradingcafeindia.com";
removalDict = { "N": 10, "B": 14, "F": 13, "M": 15, "S": 11 }
removalDict1 = { "N": 5, "B": 9, "F": 8, "M": 10, "S": 6 } // Getting Market Index from instrument 
monthMap = { '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr', '5': 'May', '6': 'Jun', '7': 'Jul', '8': 'Aug', '9': 'Sep', 'O': 'Oct', 'N': 'Nov', 'D': 'Dec' };
lot_divide = { 'BANKNIFTY': 15, 'NIFTY': 25, 'FINNIFTY': 40, 'MIDCPNIFTY': 75, 'SENSEX': 100 }

// Calling Get Expiry API
const call_acc_list_API = () => {
    $.get(root + '/acc_list', function (data, status) {
        API_data_acc_list = data
    }).done(function () {
        if (API_data_acc_list.length > 0) {
            $('#account_option').empty()
            for (let i = 0; i < API_data_acc_list.length; i++) {
                $('#account_option').append(`<option id="${API_data_acc_list[i]}" value="${API_data_acc_list[i]}">${API_data_acc_list[i]}</option>`)
            }
            currentAccount = API_data_acc_list[0]
            currentBasketAccount = API_data_acc_list[0]
            call_position_API(currentAccount)
            call_Order_Table_API(currentAccount, 'fetchAPI')

            $('#appendAccountButton').empty()
            $('#copyTo').empty()
            $('#lotSize').empty()
            for (let i = 0; i < API_data_acc_list.length; i++) {
                $('#appendAccountButton').append(`<button type="button" class="accountButton"><a href="#" class="btn2 ${currentAccount === API_data_acc_list[i] ? 'active' : ''}"><span class="spn2">${API_data_acc_list[i]}</span></a></button>`)

                let isDisabled = (API_data_acc_list[i] === currentBasketAccount) ? "disabled" : "";
                let additionalClass = (isDisabled) ? "disabled-item" : "";
                let isChecked = (!isDisabled) ? "checked" : "";
                $('#copyTo').append(`<li class="d-flex align-items-center ${additionalClass}"><input type="checkbox" class="copyToCheckbox" data-id="${API_data_acc_list[i]}" ${isChecked} ${isDisabled}><a class="dropdown-item ps-2 py-0" href="#" ${isDisabled}>${API_data_acc_list[i]}</a></li>`)

                $('#lotSize').append(`<input type="number" value="${ratio_qty[API_data_acc_list[i]]}" class="mx-2" data-account="${API_data_acc_list[i]}" oninput="setLotSize(this)" style="width:50px"> ${i != (API_data_acc_list.length - 1) ? ':' : ''}`)
                // ratio_qty[API_data_acc_list[i]] = i + 1
            }
            $('#appendAccountButton').append(`<button type="button" class="accountButton"><a href="#" class="btn2"><span class="spn2">ALL</span></a></button>`)

            $('#copyTo').append(`<div class="Togglecontainer d-flex align-items-center pt-2">
                <span style="font-size: 14px;font-weight: 600;color: #8494ef;">Ratio</span>
                <input class="mx-2" id="lotSizeSwitch" type="checkbox" />
                <span style="font-size: 14px;font-weight: 600;color: #8494ef;">Same Qty</span>
            </div>`)

            $('#copyTo').append(`<div class="d-flex justify-content-center"><button type="button" class="mt-3 p-1 btn btn-primary" onclick="copyToDiffAccount()">Done</button></div>`)
        }
    }).fail(function (response) {
        console.log("Error: " + response);
    });
}

// Calling Position API
const call_position_API = (acc) => {
    $.post(root + '/positions', { "acc": acc }, function (data, status) {
        API_data_position = data
    }).done(function () {
        let result = parse_Position_Table(API_data_position)
        if (API_data_position[API_data_position.length - 1]['live_mtm']) {

            if (API_data_position[API_data_position.length - 1]['live_mtm'] > 0) {
                $('#livemtm').css('color', '#0d9d2d')
            } else {
                $('#livemtm').css('color', '#fb6262')
            }

            $('#livemtm').text(API_data_position[API_data_position.length - 1]['live_mtm'].toFixed(2))
        }
        if (counter_for_Position_dataTable == 0) {
            counter_for_Position_dataTable += 1;
            datatable1 = $("#allPositionDatatable").DataTable({
                data: result,
                columnDefs: [
                    { targets: [0], visible: false }, // Hide the first column
                    { targets: [1], className: "dt-body-start" },
                    { targets: [2, 3, 4, 5, 6], className: "dt-body-right" },
                ],
                fnRowCallback: function (nRow, aData) {
                    if (aData[5] > 0) {
                        $("td:eq(4)", nRow).css("color", "green");
                        $("td", nRow).css("background-color", "#ebffeb");
                    } else {
                        $("td:eq(4)", nRow).css("color", "red");
                        $("td", nRow).css("background-color", "#ffecec");
                    }

                    if (aData[6] > 0) {
                        $("td:eq(5)", nRow).css("color", "green");
                    } else {
                        $("td:eq(5)", nRow).css("color", "red");
                    }
                },
                fixedColumns: true,
                autoWidth: true,
                paging: false,
                info: false,
                ordering: true,
                order: [[0, "asc"]],
                searching: true,
                dom: '<"pull-left"f><"pull-right"l>tip',
                drawCallback: function (settings) {
                    var api = this.api();
                    var rows = api.rows({ page: 'current' }).nodes();
                    var last = null;

                    api.column(0, { page: 'current' })
                        .data()
                        .each(function (group, i) {
                            if (last !== group) {
                                $(rows)
                                    .eq(i)
                                    .before(
                                        '<tr class="group"><td colspan="7" style="font-weight: 700">' +
                                        group +
                                        '</td></tr>'
                                    );

                                last = group;
                            }
                        });
                }
            });
        } else if (counter_for_Position_dataTable > 0) {
            console.log("Data is updating");
            datatable1.clear();
            datatable1.rows.add(result);
            datatable1.draw();
        }
    }).fail(function (response) {
        console.log("Error: " + response);
    });
}

// Calling Get Expiry API
const call_Get_Expiry_API = (src) => {
    $.post(root + '/get_expiry', { "index": src }, function (data, status) {
        API_data_get_expiry = data
    }).done(function () {
        if (API_data_get_expiry.length > 0) {
            $('#Market_Expiry_option').empty()
            for (var i = 0; i < API_data_get_expiry.length; i++) {
                $('#Market_Expiry_option').append(`<option id="${API_data_get_expiry[i]}" value="${API_data_get_expiry[i]}">${convertInputToOutput(API_data_get_expiry[i])}</option>`)
            }
            currentMarketExpiry = API_data_get_expiry[0]
            call_Option_Chain_API(currentMarketIndex, currentMarketExpiry)
        }
    }).fail(function (response) {
        console.log("Error: " + response);
    });
}

// Calling Option Chain API
const call_Option_Chain_API = (index, exp) => {
    $.post(root + '/option_chain', { "index": index, "exp": exp }, function (data, status) {
        API_data_option_chain = data;
    }).done(function () {
        let result = parse_Option_Chain_Data(API_data_option_chain);
        if (counter_for_Option_Chain_dataTable == 0) {
            counter_for_Option_Chain_dataTable += 1;
            datatable = $("#optionChainDatatable").DataTable({
                data: result,
                columnDefs: [
                    { targets: [0], className: "dt-body-start" },
                    { targets: [1], className: "dt-body-center" },
                    { targets: [2], className: "dt-body-right" },
                ],
                fnRowCallback: function (nRow, aData) {
                    if (aData[1] <= API_data_option_chain['ATM']) {
                        $("td:eq(0)", nRow).css("background-color", "#F1EED9");
                    } else {
                        $("td:eq(2)", nRow).css("background-color", "#F1EED9");
                    }

                    if (aData[1] == API_data_option_chain['ATM']) {
                        $("td:eq(1)", nRow).css("background-color", "#EFB41D");
                    }

                },
                fixedColumns: true,
                autoWidth: true,
                paging: false,
                info: false,
                ordering: true,
                order: [[1, "asc"]],
                searching: false,
                dom: '<"pull-left"f><"pull-right"l>tip',
            });
            scroll_to_ATM_row(result);
        } else if (counter_for_Option_Chain_dataTable > 0) {
            console.log("Data is updating");
            datatable.clear();
            datatable.rows.add(result);
            datatable.draw();

            scroll_to_ATM_row(result);
        }
    }).fail(function (response) {
        console.log("Error: " + response);
    });
}

// Calling Futures Data API
const call_Futures_Data_API = () => {
    $.get(root + '/futures_data', function (data, status) {
        API_data_futures_data = data;
    }).done(function () {
        print_Futures_data()
    }).fail(function (response) {
        console.log("Error: " + response);
    });
}

// Calling Order Table API
const call_Order_Table_API = (account, req_type) => {

    $.ajax({
        url: root + '/get_sl_tg_orders',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ "account": account, "req_type": req_type }),
        success: function (data) {
            API_data_order_table = data;
            let result = parse_Order_Table(API_data_order_table);
            if (counter_for_Pending_SLTG_dataTable == 0) {
                counter_for_Pending_SLTG_dataTable += 1;
                datatable2 = $("#orderTableDatatable").DataTable({
                    data: result,
                    scrollY: 350,
                    scrollCollapse: true,
                    fixedColumns: true,
                    autoWidth: true,
                    paging: false,
                    info: false,
                    ordering: true,
                    order: [[1, "asc"]],
                    searching: false,
                    dom: '<"pull-left"f><"pull-right"l>tip',
                });
            } else if (counter_for_Pending_SLTG_dataTable > 0) {
                console.log("Data is updating");
                datatable2.clear();
                datatable2.rows.add(result);
                datatable2.draw();
            }
        },
        error: function (response) {
            console.log("Error: " + response);
        }
    });

}

// Calling Cancel Order API
const call_Cancel_Order_API = (account, req_type, ins_id) => {

    $.ajax({
        url: root + '/cancel_sl_tg_orders',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ "account": account, "req_type": req_type, "payload": { "ins_id": ins_id } }),
        success: function (data) {
            if (data == 'ok') {
                call_Order_Table_API(currentAccount, 'fetchAPI')
                $('.cancelorder').hide()
            }
        },
        error: function (response) {
            console.log("Error: " + response);
        }
    });

}

// Function to scroll to the row containing ATM value
function scroll_to_ATM_row(result) {
    let atmRowIndex = -1; // Initialize variable to store the index of the row containing ATM value

    // Loop through the data to find the index of the row containing ATM value
    for (let i = 0; i < result.length; i++) {
        if (result[i][1] === API_data_option_chain['ATM']) {
            atmRowIndex = i; // Update the index if ATM value is found
            break; // Exit the loop once found
        }
    }

    // Scroll to the row containing ATM value if found
    if (atmRowIndex !== -1) {
        let atmRow = datatable.row(atmRowIndex).node(); // Get the DOM node of the row
        if (atmRow) {
            atmRow.scrollIntoView({ behavior: 'auto', block: 'center' }); // Scroll to the row
        }
    }
}

// Function to convert (EXPIRY) input to desired output format
function convertInputToOutput(input) {
    // Extracting year, month, and date from the input
    let year = input.slice(0, 2);
    let monthDigitOrChar = input[2];
    let date = input.slice(3);

    // Formatting the output based on the input pattern
    let output;
    if (!isNaN(input[3]) && !isNaN(input[4])) {
        let monthAbbreviation = monthMap[monthDigitOrChar];
        output = `${year}${monthAbbreviation}${date} (WK)`;
    } else {
        output = `${year}${monthDigitOrChar}${date} (MO)`;
    }

    return output;
}

// Formatting Option Chain API Data
function parse_Option_Chain_Data(optionsData) {

    let output = [];
    let ceKeys = Object.keys(optionsData).filter(key => key.includes("CE"));

    ceKeys.forEach(ceKey => {
        let prefix = ceKey.split(':')[1][0];
        let strikeValue = parseInt(ceKey.split(':')[1].substring(removalDict[prefix]).slice(0, -2));
        let ceValue = optionsData[ceKey];
        let peKey = ceKey.replace("CE", "PE");
        let peValue = optionsData[peKey];
        let ceBuyButton = $("<button>").text("BUY").addClass('me-2 green-color').attr({ 'data-bs-toggle': 'modal', 'data-bs-target': '#tradeModal', 'data-key': ceKey.split(':')[1], 'data-val': ceValue, 'data-bs': 'BUY' });
        let ceSellButton = $("<button>").text("SELL").addClass('me-2 red-color').attr({ 'data-bs-toggle': 'modal', 'data-bs-target': '#tradeModal', 'data-key': ceKey.split(':')[1], 'data-val': ceValue, 'data-bs': 'SELL' });
        let peBuyButton = $("<button>").text("BUY").addClass('ms-2 green-color').attr({ 'data-bs-toggle': 'modal', 'data-bs-target': '#tradeModal', 'data-key': peKey.split(':')[1], 'data-val': peValue, 'data-bs': 'BUY' });
        let peSellButton = $("<button>").text("SELL").addClass('ms-2 red-color').attr({ 'data-bs-toggle': 'modal', 'data-bs-target': '#tradeModal', 'data-key': peKey.split(':')[1], 'data-val': peValue, 'data-bs': 'SELL' });
        let ceCheckbox = $("<input>").prop("type", "checkbox").addClass("me-2 checkbox-class").attr({ 'data-key': ceKey.split(':')[1], 'data-val': ceValue });
        let peCheckbox = $("<input>").prop("type", "checkbox").addClass("ms-2 checkbox-class").attr({ 'data-key': peKey.split(':')[1], 'data-val': peValue });
        let ceButtons = ceCheckbox.prop('outerHTML') + ceBuyButton.prop('outerHTML') + ceSellButton.prop('outerHTML') + ceValue;
        let peButtons = peValue + peSellButton.prop('outerHTML') + peBuyButton.prop('outerHTML') + peCheckbox.prop('outerHTML');

        output.push([ceButtons, strikeValue, peButtons]);
    });

    return output;
}

// Formatting Futures API Data
function parse_Futures_Data(optionsData) {
    let filteredValues = [];
    $.each(optionsData, function (key, value) {
        let marketKey = key.split(':')[1];
        let regex = new RegExp("^" + currentMarketIndex + "\\d");
        if (regex.test(marketKey)) {
            filteredValues.push([marketKey, value]);
        }
    });
    return filteredValues;
}

// Formatting Order Table Data
function parse_Order_Table(optionsData) {
    var resultArray = [];
    $.each(optionsData, function (key, value) {
        let delkey = key
        let time = key.split('_')[0]; // Extract time from oid
        let b_s = value.b_s
        let instrument = value.instrument;
        let order_type = value.order_type;
        let qty = value.qty;
        let limit = value.limit
        let SL = value.stoploss;
        let target = value.target;
        let val = order_type == 'NRML' ? limit : order_type == 'STOPLOSS' ? SL : target
        // resultArray.push([b_s, time, instrument, order_type, qty, val, delkey]);

        let Checkbox = $("<input>").prop("type", "checkbox").addClass("me-2 delete-checkbox").attr({ 'data-val': delkey });
        let badge = `<div class="badge me-2 ${b_s == 'BUY' ? 'text-bg-success' : 'text-bg-danger'}">${b_s}</div>`
        let Instrument = Checkbox.prop('outerHTML') + badge + instrument;
        let Time = moment.unix(time).format('DD/MM/YYYY, HH:mm:ss:SSSS')
        resultArray.push([Instrument, Time, val, qty, order_type])
    });
    return resultArray
}

// Formatting Position Table Data
function parse_Position_Table(optionsData) {
    var resultArray = [];
    var dataLength = Object.keys(optionsData).length; // Get the number of rows

    // Iterate over each row except the last one
    for (let i = 0; i < dataLength - 1; i++) {
        let value = optionsData[i]; // Get the data for the current row

        // Extract values from the current row and round to two decimal places if needed
        let buy_avg = value.buy_avg !== undefined ? parseFloat(value.buy_avg).toFixed(2) : ''; // Check if the key exists
        let lastPrice = value.lastPrice !== undefined ? parseFloat(value.lastPrice).toFixed(2) : '';
        let netQuantity = value.netQuantity !== undefined ? parseFloat(value.netQuantity).toFixed(2) : '';
        let pnl = value.pnl !== undefined ? parseFloat(value.pnl).toFixed(2) : '';
        let sell_avg = value.sell_avg !== undefined ? parseFloat(value.sell_avg).toFixed(2) : '';
        let ticker = value.ticker !== undefined ? value.ticker : '';

        // Split the ticker based on the first space
        let tickerParts = ticker.split(' ');
        let name = tickerParts.length > 0 ? tickerParts[0] : '';

        // Push the extracted values to the result array
        resultArray.push([name, ticker, lastPrice, buy_avg, sell_avg, netQuantity, pnl]);
    }
    return resultArray;
}

// Printing Futures Data 
function print_Futures_data() {
    $('#FuturesDataDiv .container-fluid .row').empty()
    let filteredData = parse_Futures_Data(API_data_futures_data);
    for (let i = 0; i < filteredData.length; i++) {
        $('#FuturesDataDiv .container-fluid .row').append(`<div class="col-sm-6 mb-2 futuresdata">
            <div class="d-flex justify-content-between align-items-center">
                <h5>${filteredData[i][0]}</h5>
                <input type="checkbox" class="me-2 checkbox-class" data-key="${filteredData[i][0]}" data-val="${filteredData[i][1]}">
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <div style="font-size: 16px;">${filteredData[i][1]}</div>
                <div class="buySellBUtton">
                    <button class="green-color" data-bs-toggle="modal" data-bs-target="#tradeModal" data-key="${filteredData[i][0]}" data-val="${filteredData[i][1]}" data-bs="BUY">BUY</button>
                    <button class="me-2 red-color" data-bs-toggle="modal" data-bs-target="#tradeModal" data-key="${filteredData[i][0]}" data-val="${filteredData[i][1]}" data-bs="SELL">SELL</button>
                </div>
            </div>
        </div>`)
    }
}

// Function to merge consecutive similar items based on instrument and qty
function mergeConsecutiveItems(payload) {

    payload.sort((a, b) => {
        // Sort first by "account"
        if (a.account !== b.account) {
            return a.account.localeCompare(b.account);
        }
        // If accounts are equal, then sort by "instrument"
        return a.instrument.localeCompare(b.instrument);
    });

    let mergedPayload = [];
    let currentItem = null;
    for (let i = 0; i < payload.length; i++) {
        let item = payload[i];

        if (currentAccount !== item.account) {
            if (currentItem) {
                mergedPayload.push(currentItem);
            }
            currentItem = { ...item };
            currentAccount = item.account;
            continue;
        }

        if (currentItem && currentItem.instrument == item.instrument && currentItem.qty == item.qty && currentItem.account == item.account) {
            // If current item and previous item have the same instrument and qty, merge them
            if (item.order_type === "NRML") {
                currentItem.limit = item.limit;
            } else if (item.order_type === "STOPLOSS") {
                currentItem.stoploss = item.stoploss;
            } else if (item.order_type === "TARGET") {
                currentItem.target = item.target;
            }
        } else {
            // If not, push the current item as is
            if (currentItem) {
                mergedPayload.push(currentItem);
            }
            currentItem = { ...item }; // Clone the item to avoid reference issues
        }
    }
    if (currentItem) {
        mergedPayload.push(currentItem);
    }
    return mergedPayload;
}

// Function to unmerged data from mergedPayload Dict
function unmergeItems(payload) {
    let unmergedPayload = [];
    for (let i = 0; i < payload.length; i++) {
        let item = payload[i];

        let account = item.account
        let b_s = item.b_s == 'BUY' ? 'SELL' : 'BUY'
        let b_s_nrml = item.b_s == 'BUY' ? 'BUY' : 'SELL'
        let instrument = item.instrument
        let limit = parseInt(item.limit)
        let qty = parseInt(item.qty)
        let stoploss = parseInt(item.stoploss)
        let target = parseInt(item.target)

        let startChar = item.instrument.charAt(0);
        let index = item.instrument.substring(0, removalDict1[startChar])
        let lotDivideValue = lot_divide[index];
        if (qty % lotDivideValue !== 0) {
            alert(`Qty is not multiple of lot_divide at ${i} position`)
            anyError = true
            return
        }

        if (limit != '' && limit != null && limit > 0 && qty != '') {
            unmergedPayload.push({ "account": account, "instrument": instrument, "order_type": "NRML", "limit": limit, "qty": qty, "b_s": b_s_nrml, "stoploss": null, "target": null })
        }

        if (stoploss != '' && stoploss != null && stoploss > 0 && qty != '') {
            unmergedPayload.push({ "account": account, "instrument": instrument, "order_type": "STOPLOSS", "stoploss": stoploss, "qty": qty, "b_s": b_s, "limit": null, "target": null })
        }

        if (target != '' && target != null && target > 0 && qty != '') {
            unmergedPayload.push({ "account": account, "instrument": instrument, "order_type": "TARGET", "target": target, "qty": qty, "b_s": b_s, "limit": null, "stoploss": null })
        }
    }

    return unmergedPayload;
}

// Function to remove duplicate 
function mergeAndRemoveDuplicates(parentData, childData) {
    // Iterate through child data
    $.each(childData, function (index, childEntry) {
        // Check for duplicates in parent data
        parentData = parentData.filter(function (parentEntry) {
            return !(parentEntry.account === childEntry.account &&
                parentEntry.value === childEntry.value &&
                parentEntry.instrument === childEntry.instrument &&
                parentEntry.order_type === childEntry.order_type);
        });
        // Add child entry to parent data
        parentData.push(childEntry);
    });

    return parentData;
}

// Function to Copy Data to different Account
function copyToDiffAccount() {

    editAllRows()
    console.log(basketPayload)

    copyToAccount = [];
    let checkboxes = document.querySelectorAll('.copyToCheckbox');

    // Iterate over each checkbox
    checkboxes.forEach(function (checkbox) {
        // Check if the checkbox is checked
        if (checkbox.checked) {
            // Extract the data-id attribute value and push it into the array
            let id = checkbox.getAttribute('data-id');
            copyToAccount.push(id);
        }
    });

    sameQty_Ratio = $('#lotSizeSwitch').is(':checked') == true ? 'Same Qty' : 'Ratio'

    clonedPayload = [];
    let alertShown = false;

    // Filter basketPayload to get only the items with account matching currentBasketAccount
    let itemsToCopy = basketPayload.filter(item => item.account === currentBasketAccount);
    itemsToCopy.forEach(function (item) {

        if (alertShown) {
            return; // Stop the loop if alert has been shown
        }

        // Check if the instrument is in removalDict1
        let startChar = item.instrument.charAt(0);
        if (startChar in removalDict1) {
            let index = item.instrument.substring(0, removalDict1[startChar]); // Parsing the index from the instrument
            let lotDivide = lot_divide[index]; // Retrieving the lot divide for the instrument

            if (item.qty % lotDivide !== 0) {
                // Log or handle the case where qty is not a multiple of lotDivide
                alert(`Quantity (${item.qty}) is not a multiple of lot divide (${lotDivide}) for instrument ${item.instrument}`);
                alertShown = true;
                return; // Stop execution of the function
            }

            // Check if sameQty_Ratio is "Ratio"
            if (sameQty_Ratio === "Ratio") {
                // Retrieve the lot size for both accounts
                let lotSizeSource = ratio_qty[item.account];
                let copiedAccounts = copyToAccount.length > 0 ? copyToAccount : [item.account]; // If copyToAccount is empty, default to the current account

                // Iterate over each account to copy to
                copiedAccounts.forEach(function (destinationAccount) {
                    // Clone the item for each destination account
                    let clonedItem = Object.assign({}, item);

                    // Change the account to the current destination account
                    clonedItem.account = destinationAccount;

                    // Retrieve the lot size for the destination account
                    let lotSizeDestination = ratio_qty[destinationAccount];

                    // Calculate the new quantity based on the ratio of lot sizes
                    if (lotSizeSource && lotSizeDestination) {
                        // Calculate the ratio between lot sizes
                        let ratio = lotSizeDestination / lotSizeSource;

                        // Multiply the original quantity by the ratio
                        clonedItem.qty = item.qty * ratio;
                    }

                    if (clonedPayload.some(item => item.account == destinationAccount && item.instrument == clonedItem.instrument && item.order_type == clonedItem.order_type)) {
                        // Skip copying if the instrument is already present in the destination account
                        return;
                    }

                    // Push the modified object into the clonedPayload array
                    clonedPayload.push(clonedItem);
                });
            } else {
                // For "Same Qty", simply copy the item to each destination account
                let copiedAccounts = copyToAccount.length > 0 ? copyToAccount : [item.account]; // If copyToAccount is empty, default to the current account

                // Iterate over each account to copy to
                copiedAccounts.forEach(function (destinationAccount) {
                    // Clone the item for each destination account
                    let clonedItem = Object.assign({}, item);

                    // Change the account to the current destination account
                    clonedItem.account = destinationAccount;

                    if (clonedPayload.some(item => item.account == destinationAccount && item.instrument == clonedItem.instrument && item.order_type == clonedItem.order_type)) {
                        // Skip copying if the instrument is already present in the destination account
                        return;
                    }

                    // Push the modified object into the clonedPayload array
                    clonedPayload.push(clonedItem);
                });
            }
        }
    });

    var mergedData = mergeAndRemoveDuplicates(basketPayload, clonedPayload);

    basketPayload = mergedData

}

// Function to toggle buy_Sell in Basket Modal
function tog_B_S(input) {

    let ParentTr = input.parentNode.parentNode

    let account = ParentTr.children[0].textContent;
    let Instrument = ParentTr.children[2].textContent;
    let LTP = ParentTr.children[3].textContent;

    let tempVal = ''

    // Toggle text content
    if (input.textContent.trim() === "BUY") {
        input.textContent = "SELL";
        tempVal = "SELL"
        tempVal1 = "BUY"
    } else if (input.textContent.trim() === "SELL") {
        input.textContent = "BUY";
        tempVal = "BUY"
        tempVal1 = "SELL"
    }

    // Toggle classes
    input.classList.toggle("green-color");
    input.classList.toggle("red-color");

    for (const payload of [basketPayload, mergedPayload]) {
        for (let item of payload) {
            if (item.account == account && item.instrument == Instrument && item.value == LTP) {
                if (item.order_type == 'NRML') {
                    item.b_s = tempVal.toUpperCase();
                } else if (item.order_type == 'STOPLOSS' || item.order_type == 'TARGET') {
                    item.b_s = tempVal1.toUpperCase();
                }
            }
        }
    }
}

// Printing Basket Modal data
function addData() {

    $('#quantityBasket').attr('step', lot_divide[currentMarketIndex])

    mergedPayload = mergeConsecutiveItems(basketPayload);

    // Get the table and insert a new row at the end 
    let table = document.getElementById("outputTable");

    // Remove all rows except the heading row (index 0)
    while (table.rows.length > 1) {
        table.deleteRow(1); // Delete rows starting from index 1
    }

    if (currentBasketAccount != 'ALL') {
        filteredPayload = mergedPayload.filter(item => item.account === currentBasketAccount);
        filteredPayload.length == 0 ? $('#copyToButton').hide() : $('#copyToButton').show()
    } else {
        filteredPayload = mergedPayload
    }

    for (let i = 0; i < filteredPayload.length; i++) {
        let newRow = table.insertRow(table.rows.length);
        // Insert data into cells of the new row
        let startChar = filteredPayload[i].instrument.charAt(0);
        let index = filteredPayload[i].instrument.substring(0, removalDict1[startChar])

        newRow.insertCell(0).innerHTML = filteredPayload[i].account;
        newRow.insertCell(1).innerHTML = `<div class="${filteredPayload[i].b_s == 'BUY' ? 'green-color' : 'red-color'} px-1 bsModal" onClick="tog_B_S(this)" style="cursor: pointer">${filteredPayload[i].b_s}</div>`;
        newRow.insertCell(2).innerHTML = filteredPayload[i].instrument;
        newRow.insertCell(3).innerHTML = filteredPayload[i].value;
        let limitValue = filteredPayload[i].limit ? filteredPayload[i].limit : 0;
        newRow.insertCell(4).innerHTML = `<input type="number" class="w-100" id="limitBasket${i}" value="${limitValue}" oninput="editData(this)">`;
        let qtyValue = filteredPayload[i].qty ? filteredPayload[i].qty : 0;
        newRow.insertCell(5).innerHTML = `<div class="number-input"><button type="button" onclick="decrementValue2(this.parentNode)" style="font-size: 24px;font-weight: 600;">-</button>
            <input type="number" min="0" step="${lot_divide[index]}" class="w-100" data-class="qtyInput" id="qtyBasket${i}" value="${qtyValue}" oninput="editData(this)"><button type="button"  onclick="incrementValue2 (this.parentNode)" style="font-size: 20px;font-weight: 600;">+</button></div>`;
        let stoplossValue = filteredPayload[i].stoploss ? filteredPayload[i].stoploss : 0;
        newRow.insertCell(6).innerHTML = `<input type="number" class="w-100" id="stoplossBasket${i}" value="${stoplossValue}" oninput="editData(this)">`;
        let targetValue = filteredPayload[i].target ? filteredPayload[i].target : 0;
        newRow.insertCell(7).innerHTML = `<input type="number" class="w-100" id="targetBasket${i}" value="${targetValue}" oninput="editData(this)">`;
        newRow.insertCell(8).innerHTML = `<div class="d-flex justify-content-center" style="cursor: pointer" id="delbtn${i}" data-acc="${filteredPayload[i].account}" data-val="${filteredPayload[i].instrument}" onclick="removeData(this)"><i class="fa-solid fa-circle-xmark fa-lg" style="color: #ec7474;"></i></div>`;
        newRow.insertCell(9).innerHTML = `<div class="d-flex justify-content-center updateData" style="cursor: pointer" onclick="editData1(this)"><img src="img/update.png" id="imgBasket${i}" width="25px"></div>`;
    }
}

// Editing Basket Modal data
function editData(input) {

    // Get the parent row of the clicked button 
    let row
    if (input.getAttribute('data-class') == 'qtyInput') {
        row = input.parentNode.parentNode.parentNode;
    } else {
        row = input.parentNode.parentNode;
    }

    // Get the index of the row
    let rowIndex = row.rowIndex - 1; // Subtract 1 to account for the heading row

    // Get the values from the first two cells (td elements)
    let bsValue = row.cells[1].innerHTML.trim();
    let $element = $(bsValue);
    let bsText = $element.text();
    let instrumentValue = row.cells[2].innerHTML.trim();

    // Get the updated values from the input boxes
    let limitInput = document.getElementById(`limitBasket${rowIndex}`).value.trim();
    let qtyInput = document.getElementById(`qtyBasket${rowIndex}`).value.trim();
    let stoplossInput = document.getElementById(`stoplossBasket${rowIndex}`).value.trim();
    let targetInput = document.getElementById(`targetBasket${rowIndex}`).value.trim();

    // Update mergedPayload array with new limit and quantity values
    for (let i = 0; i < mergedPayload.length; i++) {
        if (mergedPayload[i].instrument === instrumentValue && mergedPayload[i].b_s === bsText) {
            mergedPayload[i].qty = qtyInput;
            mergedPayload[i].limit = limitInput;
            mergedPayload[i].stoploss = stoplossInput;
            mergedPayload[i].target = targetInput;
        }
    }
}

// Editing Basket Modal data
function editData1(input) {

    // Get the parent row of the clicked button 
    let row = input.parentNode.parentNode;

    // Get the index of the row
    let rowIndex = row.rowIndex - 1; // Subtract 1 to account for the heading row

    // Get the values from the first two cells (td elements)
    let bsValue = row.cells[1].innerHTML.trim();
    let $element = $(bsValue);
    let bsText = $element.text();
    let instrumentValue = row.cells[2].innerHTML.trim();

    // Get the updated values from the input boxes
    let limitInput = document.getElementById(`limitBasket${rowIndex}`).value.trim();
    let qtyInput = document.getElementById(`qtyBasket${rowIndex}`).value.trim();
    let stoplossInput = document.getElementById(`stoplossBasket${rowIndex}`).value.trim();
    let targetInput = document.getElementById(`targetBasket${rowIndex}`).value.trim();

    if (parseInt(qtyInput) == 0 && (parseInt(limitInput) == 0 || parseInt(stoplossInput) == 0 || parseInt(targetInput) == 0)) {
        errorInEditingAllRowTogether = true
        return
    } else {
        errorInEditingAllRowTogether = false
    }

    // Update basketPayload array with new limit and quantity values
    for (let i = 0; i < basketPayload.length; i++) {

        if (basketPayload[i].instrument === instrumentValue) {
            basketPayload[i].qty = qtyInput;

            if (basketPayload[i].order_type == "NRML") {
                basketPayload[i].limit = limitInput;
            }

            if (basketPayload[i].order_type == "STOPLOSS" && basketPayload[i].stoploss != null) {
                basketPayload[i].stoploss = stoplossInput;
            } else if (basketPayload[i].stoploss == null && (stoplossInput != '0' || stoplossInput != 0)) {
                let newb_s = basketPayload[i].b_s === "BUY" ? "SELL" : "BUY"
                const existingStopLoss = basketPayload.find(item => item.instrument === instrumentValue && item.order_type === "STOPLOSS");
                if (!existingStopLoss) {
                    basketPayload.push({ "account": currentBasketAccount, "value": basketPayload[i].value, "instrument": instrumentValue, "order_type": "STOPLOSS", "stoploss": stoplossInput, "qty": qtyInput, "b_s": newb_s, "limit": null, "target": null })
                } else {
                    existingStopLoss.stoploss = stoplossInput
                }
            }

            if (basketPayload[i].order_type == "TARGET" && basketPayload[i].target != null) {
                basketPayload[i].target = targetInput;
            } else if (basketPayload[i].target == null && (targetInput != '0' || targetInput != 0)) {
                let newb_s = basketPayload[i].b_s === "BUY" ? "SELL" : "BUY"
                const existingTarget = basketPayload.find(item => item.instrument === instrumentValue && item.order_type === "TARGET");
                if (!existingTarget) {
                    basketPayload.push({ "account": currentBasketAccount, "value": basketPayload[i].value, "instrument": instrumentValue, "order_type": "TARGET", "target": targetInput, "qty": qtyInput, "b_s": newb_s, "limit": null, "stoploss": null })
                } else {
                    existingTarget.target = targetInput
                }
            }

            break

        }
    }

    if (!editAllRowsTogether) {
        alert('Row updated')
    }
}

// Updating all Row together before copying
function editAllRows() {

    editAllRowsTogether = true

    const table = document.getElementById('outputTable');

    // Get all table rows (excluding the header row)
    const rows = Array.from(table.querySelectorAll('tbody tr')).slice(1);

    for (const row of rows) {
        // Call editData1 function for each row, passing the clicked element (div)
        editData1(row.querySelector('.d-flex.justify-content-center.updateData')); // Select by class names
    }

    if (errorInEditingAllRowTogether == false) {
        alert('All rows updated')
        editAllRowsTogether = false
    }

}

// Editing value of lotsize 
function setLotSize(input) {
    const account = input.getAttribute('data-account');
    const value = parseInt(input.value);
    ratio_qty[account] = value;
    setItemWithExpiry('ratio_qty', JSON.stringify(ratio_qty));
}

// Removing Basket Modal data
function removeData(input) {
    var dataVal = input.getAttribute('data-val');
    var dataAcc = input.getAttribute('data-acc');
    var dataBs = input.getAttribute('data-bs');

    // Uncheck checkboxes with matching data-key
    $('.checkbox-class[data-key="' + dataVal + '"]').prop('checked', false);

    // Remove classes from buttons with matching data-key
    $('.green-color[data-key="' + dataVal + '"]').removeClass('green-border');
    $('.red-color[data-key="' + dataVal + '"]').removeClass('red-border');

    // Removing from mergedPayload
    mergedPayload = mergedPayload.filter(function (item) {
        return item.instrument !== dataVal || item.account !== dataAcc;
    });

    // Removing from basketPayload
    basketPayload = basketPayload.filter(function (item) {
        return item.instrument !== dataVal || item.account !== dataAcc;
    });

    addData()
}

function clearData() {

    let confirmation = confirm("Are you sure you want to clear ?");

    if (confirmation) {
        // Uncheck all checkboxes
        $('.checkbox-class').prop('checked', false);

        // Remove classes from buttons
        $('.green-color').removeClass('green-border');
        $('.red-color').removeClass('red-border');

        if (currentBasketAccount == 'ALL') {
            mergedPayload = []
            basketPayload = []
        } else {
            // Removing from mergedPayload
            mergedPayload = mergedPayload.filter(function (item) {
                return item.account !== currentBasketAccount;
            });

            // Removing from basketPayload
            basketPayload = basketPayload.filter(function (item) {
                return item.account !== currentBasketAccount;
            });

        }

        if ($('.checkbox-class:checked').length === 0) {
            $("#ViewBasket").hide();
        }

        addData()
    }
}

function clearAllData() {

    let confirmation = confirm("Are you sure you want to clear data from all Account ?");
    if (confirmation) {
        // Uncheck all checkboxes
        $('.checkbox-class').prop('checked', false);
        // Remove classes from buttons
        $('.green-color').removeClass('green-border');
        $('.red-color').removeClass('red-border');
        mergedPayload = []
        basketPayload = []
        addData()

        $("#ViewBasket").hide();
    }
}

// Function to update payload when checkbox state changes
function updateBasketPayload(checkbox) {
    let parentElement = checkbox.parentNode;
    let buttons = parentElement.getElementsByTagName('button');
    if(currentMarket == 'Futures') {
        buttons = parentElement.parentNode.getElementsByTagName('button');
    }
    
    let instrument = checkbox.dataset.key;
    let value = parseFloat(checkbox.dataset.val);
    let bs

    let checkboxPosition = $(checkbox).offset();
    let newPosition = {
        top: `${checkboxPosition.top}px`,
        left: `${checkboxPosition.left}px`
    }
    setTimeout(() => {
        $('div.swal2-popup').css(newPosition);
    }, 150);

    // If checkbox is checked, add to payload
    if (checkbox.checked) {
        jQuery.getScript('https://cdn.jsdelivr.net/npm/sweetalert2@11', function () {
            Swal.fire({
                showCancelButton: true,
                focusConfirm: false,
                confirmButtonText: `BUY`,
                cancelButtonText: `SELL`,
                confirmButtonColor: `#aaffbd`,
                cancelButtonColor: `#ffaaaa`,
            }).then((result) => {

                if (result.dismiss == 'backdrop') {
                    checkbox.checked = false
                    return
                }

                if (result.isConfirmed) {
                    bs = 'BUY'
                } else if (result.dismiss == 'cancel') {
                    bs = 'SELL'
                }
                basketPayload.push({ "account": currentBasketAccount, "instrument": instrument, "value": value, 'b_s': bs, "order_type": "NRML", "target": null, "stoploss": null });

                for (var i = 0; i < buttons.length; i++) {
                    if (buttons[i].getAttribute('data-bs') == bs) {
                        buttons[i].classList.add(bs == 'BUY' ? 'green-border' : 'red-border');
                    }
                }
            })
        });
        $("#ViewBasket").show();
    } else { // If checkbox is unchecked, remove from payload
        basketPayload = basketPayload.filter(item => item.instrument !== instrument);

        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove('green-border', 'red-border');
        }

        if ($('.checkbox-class:checked').length === 0) {
            $("#ViewBasket").hide();
        }
    }
}

// Function to delete order when checkbox state changes
function deletecheckbox(checkbox) {

    var dataVal = checkbox.getAttribute("data-val");
    if (checkbox.checked) {
        delCheckbox.push(dataVal)
        $(".cancelorder").show();
    } else {
        var index = delCheckbox.indexOf(dataVal);
        if (index !== -1) {
            delCheckbox.splice(index, 1);
        }
        if ($('.delete-checkbox:checked').length === 0) {
            $(".cancelorder").hide();
        }
    }
}

// Function to place order (Modal Submit Button)
function placeOrder() {
    let b_s = $('#badge').text() == 'BUY' ? 'SELL' : 'BUY'
    let b_s_nrml = $('#badge').text() == 'BUY' ? 'BUY' : 'SELL'
    let instrument = $('#modalKey').text()
    let limit = parseInt($('#limit').val())
    let qty = parseInt($('#quantity').val())
    let stoploss = parseInt($('#sl').val())
    let target = parseInt($('#tg').val())

    if (limit != '' && limit != null && limit > 0 && qty != '') {
        payload.push({ "instrument": instrument, "order_type": "NRML", "limit": limit, "qty": qty, "b_s": b_s_nrml, "stoploss": null, "target": null })
    }

    if (stoploss != '' && stoploss != null && stoploss > 0 && qty != '') {
        payload.push({ "instrument": instrument, "order_type": "STOPLOSS", "stoploss": stoploss, "qty": qty, "b_s": b_s, "limit": null, "target": null })
    }

    if (target != '' && target != null && target > 0 && qty != '') {
        payload.push({ "instrument": instrument, "order_type": "TARGET", "target": target, "qty": qty, "b_s": b_s, "limit": null, "stoploss": null })
    }

    if (payload.length == 0) {
        alert("empty payload")
        return
    }

    $.ajax({
        url: root + '/order',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ "account": currentAccount, "req_type": "orderAPI", "payload": payload }),
        success: function (data) {
            if (data == 'ok') {
                payload = []
                $('#limit').val('')
                $('#quantity').val('')
                $('#sl').val('')
                $('#tg').val('')

                $('#tradeModal').modal('hide');

                call_Order_Table_API(currentAccount, 'fetchAPI')
            }
        },
        error: function (response) {
            console.log("Error: " + response);
        }
    });
}

// Function to place order (Modal Submit Button)
function placeOrderBasket() {

    unmergedPayload = unmergeItems(mergedPayload);

    var btn2Elements = document.querySelectorAll('a.btn2');
    spanValues = [];
    btn2Elements.forEach(function (element) {
        if (element.classList.contains('active')) {
            var spanElement = element.querySelector('span');
            if (spanElement.textContent !== "ALL") {
                spanValues.push(spanElement.textContent);
            } else {
                document.querySelectorAll('a.btn2 span.spn2').forEach(function (span) {
                    if (span.textContent !== "ALL") {
                        spanValues.push(span.textContent);
                    }
                });
            }
        }
    });

    if (unmergedPayload == undefined) {
        alert("payload is undefined")
        return
    }

    if (unmergedPayload.length == 0) {
        alert("empty payload")
        return
    }

    for (let i = 0; i < spanValues.length; i++) {
        if (!anyError) {

            let matchingOrders = unmergedPayload.filter(order => order.account === spanValues[i]).map(order => Object.fromEntries(Object.entries(order).filter(([key]) => key !== "account")));

            $.ajax({
                url: root + '/order',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ "account": spanValues[i], "req_type": "orderAPI", "payload": matchingOrders }),
                success: function (data) {
                    if (data == 'ok') {

                        $('#tradeModalBasket').modal('hide');
                        $("#ViewBasket").hide();

                        call_Order_Table_API(currentAccount, 'fetchAPI')

                        uncheckAllCheckboxes()
                        removeBorderClasses()
                    }
                },
                error: function (response) {
                    console.log("Error: " + response);
                }
            });
        }
    }

    unmergedPayload = []
    mergedPayload = []
    basketPayload = []
    currentBasketAccount = '5paisa'

}

// Function to place order (Modal Submit Button)
function addToBasket() {
    let b_s = $('#badge').text() == 'BUY' ? 'SELL' : 'BUY'
    let b_s_nrml = $('#badge').text() == 'BUY' ? 'BUY' : 'SELL'
    let instrument = $('#modalKey').text()
    let value = $('#modalValue').text()
    let limit = $('#limit').val()
    let qty = $('#quantity').val()
    let stoploss = $('#sl').val()
    let target = $('#tg').val()

    if (limit != '' && qty != '') {
        basketPayload.push({ "account": currentBasketAccount, "b_s": b_s_nrml, "instrument": instrument, "order_type": "NRML", "limit": limit, "qty": qty, "stoploss": null, "target": null, "value": value })
    }

    if (stoploss != '' && qty != '') {
        basketPayload.push({ "account": currentBasketAccount, "b_s": b_s, "instrument": instrument, "order_type": "STOPLOSS", "stoploss": stoploss, "qty": qty, "limit": null, "target": null, "value": value })
    }

    if (target != '' && qty != '') {
        basketPayload.push({ "account": currentBasketAccount, "b_s": b_s, "instrument": instrument, "order_type": "TARGET", "target": target, "qty": qty, "limit": null, "stoploss": null, "value": value })
    }

    $('#tradeModal').modal('hide');

    if (basketPayload.length > 0) {
        $("#ViewBasket").show();
    }

    $('#limit').val('')
    $('#quantity').val('')
    $('#sl').val('')
    $('#tg').val('')
}

// Function to check user should not able to type after 1 decimal point
function checkDecimal(input) {
    // Get the current value of the input field
    var value = input.value;

    // Split the value by decimal point
    var parts = value.split('.');

    // If there is a decimal point and the second part has more than one character,
    // keep only the first character after the decimal point
    if (parts.length > 1 && parts[1].length > 1) {
        input.value = parts[0] + '.' + parts[1].charAt(0);
    }

    checkInput()
}

// Function to clear the input box value
function clearmodalform() {
    $('#limit').val('')
    $('#quantity').val('')
    $('#sl').val('')
    $('#tg').val('')

    var placeOrderBtn = $('#placeOrderBtn');
    placeOrderBtn.prop('disabled', true);
}

// Function to enable "Place Order" Button
function checkInput() {
    var orderType = document.getElementById("orderType").checked;
    var quantity = document.getElementById("quantity").value.trim();
    var limit = document.getElementById("limit").value.trim();
    var sl = document.getElementById("sl").value.trim();
    var tg = document.getElementById("tg").value.trim();
    var placeOrderBtn = $('#placeOrderBtn');

    if (orderType) {
        // SL_TG mode
        if (quantity && (sl || tg)) {
            placeOrderBtn.prop('disabled', false);
        } else {
            placeOrderBtn.prop('disabled', true);
        }
    } else {
        // NRML mode
        if (quantity && limit) {
            placeOrderBtn.prop('disabled', false);
        } else {
            placeOrderBtn.prop('disabled', true);
        }
    }
}

function checkInput1() {
    var quantity1 = document.getElementById("quantityBasket").value.trim();

    // Update basketPayload array with new limit and quantity values
    for (let i = 0; i < basketPayload.length; i++) {
        basketPayload[i].qty = quantity1;
    }

    // Update table rows with new limit and quantity values
    let table = document.getElementById("outputTable");
    for (let i = 1; i < table.rows.length; i++) {
        document.getElementById(`qtyBasket${i - 1}`).value = quantity1;
    }
}

// Function to decrement the value and call checkInput()
function decrementValue(parentNode) {
    var input = parentNode.querySelector('input[type=number]');
    input.stepDown();
    checkInput();
}

function decrementValue1(parentNode) {
    var input = parentNode.querySelector('input[type=number]');
    input.stepDown();
    checkInput1();
}

function decrementValue2(parentNode) {

    var input = parentNode.querySelector('input[type=number]');
    input.stepDown();
    editData(input)
}

// Function to increment the value and call checkInput()
function incrementValue(parentNode) {
    var input = parentNode.querySelector('input[type=number]');
    input.stepUp();
    checkInput();
}

function incrementValue1(parentNode) {
    var input = parentNode.querySelector('input[type=number]');
    input.stepUp();
    checkInput1();
}

function incrementValue2(parentNode) {
    var input = parentNode.querySelector('input[type=number]');
    input.stepUp();
    editData(input)
}

// Function to uncheck all the checkbox
function uncheckAllCheckboxes() {
    // Get all checkbox elements on the page
    let checkboxes = document.querySelectorAll('input[type="checkbox"]:not(.copyToCheckbox)');

    // Iterate through each checkbox and uncheck it
    checkboxes.forEach(function (checkbox) {
        checkbox.checked = false;
    });
}

// Function to remove border class
function removeBorderClasses() {
    // Get all buttons with class "green-border" or "red-border"
    let buttons = document.querySelectorAll('.green-border, .red-border');

    // Iterate through each button and remove the classes
    buttons.forEach(function (button) {
        button.classList.remove('green-border', 'red-border');
    });
}

// Function to set localstorageWithExpiry
function setItemWithExpiry(key, value) {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0); // Next day midnight
    const expiry = midnight - now; // Time remaining until midnight

    localStorage.setItem(key, JSON.stringify({
        value: value,
        expiry: now.getTime() + expiry // Expiry time
    }));
}

// Function to get data from localstorageWithExpiry
function getItemWithExpiry(key) {
    const itemString = localStorage.getItem(key);
    if (!itemString) {
        return null;
    }
    const item = JSON.parse(itemString);
    const now = new Date().getTime();
    if (now > item.expiry) { // Check if expired
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

// Function Call after changing Account Dropdown
$(document).on("change", "#account_option", function () {
    currentAccount = $("#account_option").val();

    if (counter_for_Position_dataTable > 0) {
        datatable1.clear(); // clear datatable second
        datatable1.rows.add([]);
        datatable1.draw();
    }
    call_position_API(currentAccount)
    call_Order_Table_API(currentAccount, 'fetchAPI')

    $('#appendAccountButton').empty()
    for (var i = 0; i < API_data_acc_list.length; i++) {
        $('#appendAccountButton').append(`<button type="button" class="accountButton"><a href="#" class="btn2 ${currentAccount === API_data_acc_list[i] ? 'active' : ''}"><span class="spn2">${API_data_acc_list[i]}</span></a></button>`)
    }

})

// Click event handler for selecting account buttons in modal
$(document).on('click', '.accountButton', function () {
    $('.accountButton .btn2').removeClass('active');
    $(this).find('.btn2').toggleClass('active');
    currentBasketAccount = $(this).find('.spn2').text()

    currentBasketAccount == 'ALL' ? $('#copyToButton').hide() : $('#copyToButton').show()

    $('#copyTo li').each(function () {
        let accountName = $(this).find('a').text();
        let isDisabled = (accountName === currentBasketAccount) ? "disabled" : "";
        let isChecked = (!isDisabled) ? "checked" : "";

        $(this).toggleClass('disabled-item', !!isDisabled);
        $(this).find('input[type="checkbox"]').prop('checked', !!isChecked).prop('disabled', !!isDisabled);
    });

    addData()
});

// Function Call after changing Market Index Dropdown
$(document).on("change", "#Market_Index_option", function () {
    currentMarketIndex = $("#Market_Index_option").val();

    if (currentMarket == 'Option Chain') {
        $('#Market_Expiry_option').empty() // clear expiry dropdown first
        if (counter_for_Option_Chain_dataTable > 0) {
            datatable.clear(); // clear datatable second
            datatable.rows.add([]);
            datatable.draw();
        }
        call_Get_Expiry_API(currentMarketIndex)
    } else if (currentMarket == 'Futures') {
        // don't call API dirtectly clear the previous data and show new data
        print_Futures_data()
    }
})

// Function Call after changing Market Expiry Dropdown
$(document).on("change", "#Market_Expiry_option", function () {
    currentMarketExpiry = $("#Market_Expiry_option").val();

    call_Option_Chain_API(currentMarketIndex, currentMarketExpiry)
})

// Function call for change between OPTION/FUTURES
$(document).on("change", 'input[name="update_radio_button_market"]', function () {
    currentMarket = $('input[name="update_radio_button_market"]:checked').val();
    $('#selectedMarket').text(currentMarket)
    currentMarket == 'Futures' ? $('#Market_Expiry_option').addClass('d-none') : $('#Market_Expiry_option').removeClass('d-none')

    if (currentMarket == 'Futures') {
        $('#FuturesDataDiv').removeClass('d-none')
        $('#optionChainDatatableDiv').addClass('d-none')
        call_Futures_Data_API()
    } else {
        $('#FuturesDataDiv').addClass('d-none')
        $('#optionChainDatatableDiv').removeClass('d-none')
        $('#Market_Expiry_option').empty() // clear expiry dropdown first
        if (counter_for_Option_Chain_dataTable > 0) {
            datatable.clear(); // clear datatable second
            datatable.rows.add([]);
            datatable.draw();
        }
        call_Get_Expiry_API(currentMarketIndex)
    }

});

// Function Call after changing Buy Sell Modal (Order type) Dropdown
$(document).on("change", "#orderType", function () {
    currentOrderType = $(this).is(":checked");

    if (currentOrderType) {
        $('.limitClass').hide()
    } else {
        $('.limitClass').show()
    }

    clearmodalform()
})

// Function Call after clicking Modal
$(document).on("click", '.green-color, .red-color', function () {
    var key = $(this).data('key');
    var val = $(this).data('val');
    var bs = $(this).data('bs');

    bs == 'BUY' ? $('#badge').removeClass().addClass('badge text-bg-success me-2') : $('#badge').removeClass().addClass('badge text-bg-danger me-2')
    bs == 'BUY' ? $('#modalValue').removeClass().addClass('text-success') : $('#modalValue').removeClass().addClass('text-danger')

    $('#modalKey').text(key)
    $('#modalValue').text(val)
    $('#badge').text(bs)

    $('#quantity').attr('step', lot_divide[currentMarketIndex])

})

// Function Call after clicking badge
$(document).on("click", '#badge', function () {
    var val = $(this).text();

    val == 'BUY' ? $(this).text('SELL').removeClass().addClass('badge text-bg-danger me-2') : $(this).text('BUY').removeClass().addClass('badge text-bg-success me-2')
    val == 'SELL' ? $('#modalValue').removeClass().addClass('text-success') : $('#modalValue').removeClass().addClass('text-danger')
    val == 'SELL' ? $('#tradeModal .modal-content').removeClass().addClass('modal-content buyModal') : $('#tradeModal .modal-content').removeClass().addClass('modal-content sellModal')

})

// function to change color when modal is open
$(document).on("shown.bs.modal", '#tradeModal', function () {

    let b_s = $('#badge').text()

    b_s == 'BUY' ? $('#tradeModal .modal-content').removeClass().addClass('modal-content buyModal') : $('#tradeModal .modal-content').removeClass().addClass('modal-content sellModal')
});

// Attach event handlers to checkboxes
$(document).on('change', '.checkbox-class', function () {
    updateBasketPayload(this);
});

// Attach event handlers to cancel order checkboxes
$(document).on('change', '.delete-checkbox', function () {
    deletecheckbox(this);
});

// Attach event handlers to cancel order checkboxes
$(document).on('click', '#selectAllButton', function () {
    $(".cancelorder").show();
    $('.delete-checkbox').prop('checked', true);

    $('.delete-checkbox').each(function () {
        var dataVal = $(this).attr("data-val");
        if (delCheckbox.indexOf(dataVal) === -1) {
            delCheckbox.push(dataVal);
        }
    });
});

// Function Call when cancel button is clicked
$(document).on('click', '.cancelorder', function () {
    var confirmation = confirm("Are you sure you want to cancel this order?");
    if (confirmation) {
        call_Cancel_Order_API(currentAccount, "fetchAPI", delCheckbox);
    }
});

// Function to call on Page Refresh
$(document).ready(function () {

    $.ajaxSetup({ async: false }); // to stop async

    console.log = function () { };

    counter_for_Option_Chain_dataTable = counter_for_Position_dataTable = counter_for_Pending_SLTG_dataTable = 0

    currentMarket = 'Option Chain'
    currentMarketIndex = 'NIFTY'
    currentMarketExpiry = ''
    currentMarketATM = ''
    basketPayload = []
    payload = []
    delCheckbox = []
    anyError = false
    editAllRowsTogether = false
    errorInEditingAllRowTogether = false

    only_once = 0

    const localvalue = getItemWithExpiry('ratio_qty');
    if (localvalue !== null) {
        ratio_qty = JSON.parse(localvalue)
    } else {
        setItemWithExpiry('ratio_qty', JSON.stringify({ '5paisa': 1, 'api05': 2, 'api27': 3 }));
        ratio_qty = { '5paisa': 1, 'api05': 2, 'api27': 3 }
    }

    $("#ViewBasket").hide();
    $(".cancelorder").hide();

    call_acc_list_API()
    call_Get_Expiry_API(currentMarketIndex)

    if ($(document).width() < 576) {
        $('#ViewBasket').html('View <i class="fa-solid fa-basket-shopping"></i>')
    } else {
        $('#ViewBasket').html('View Basket')
    }

});

// Function to call On resize
$(window).on('resize', function () {
    if ($(document).width() < 576) {
        $('#ViewBasket').html('View <i class="fa-solid fa-basket-shopping"></i>')
    } else {
        $('#ViewBasket').html('View Basket')
    }
})