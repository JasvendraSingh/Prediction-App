*** Settings ***
Library        Browser

*** Variables ***
${URL}            http://frontend:5173
${BACKEND_URL}    http://backend:8000

*** Keywords ***
Open Browser To App
     [Documentation]    Open browser and navigate to the application
    New Browser    chromium    headless=True
    New Page    ${URL}
    Sleep    2s
    Handle Codespace Port

Handle Codespace Port
    [Documentation]    Detect GitHub port interstitial and click Continue if present
    ${selectors}=    Create List
    ...    xpath=//button[normalize-space(.)="Continue"]
    ...    css=button[aria-label="Continue"]
    FOR    ${sel}    IN    @{selectors}
        ${exists}=    Run Keyword And Return Status    Wait For Elements State    ${sel}    visible    timeout=3s
        IF    ${exists}
            Log    Found interstitial continue button using selector: ${sel}
            Click    ${sel}
            Sleep    1s
            RETURN
        END
    END
    Log    No interstitial found (or already accepted)

Select UCFL League
    Wait For Elements State    css=select.MuiBox-root    visible    timeout=10s
    Click    css=.MuiCard-root select
    Select Options By    css=select.MuiBox-root    value    UCFL    
    Sleep    1s

Get Matchday Count
    [Documentation]    Calculate total number of matchdays (assumes 18 matches per matchday)
    ${inputs}=    Get Elements    css=.MuiTextField-root input
    ${input_count}=    Get Length    ${inputs}
    ${match_count}=    Evaluate    ${input_count} / 2
    Log    Found ${match_count} matches in this matchday
    Set Global Variable    ${MATCH_COUNT}    ${match_count}
    RETURN    ${match_count}

Fill Predictions With Random Scores
    [Documentation]    Fill all prediction inputs with scores between 0-3
    ${inputs}=    Get Elements    css=.MuiTextField-root input[placeholder="0"]
    ${input_count}=    Get Length    ${inputs}
    FOR    ${input}    IN    @{inputs}
        ${score}=    Evaluate    random.randint(0, 3)    modules=random
        Fill Text    ${input}    ${score}
    END
    Sleep    1s
    Log    All predictions filled

Click Next Button
    [Documentation]    Click Next Matchday button
    Click              xpath=//button[contains(., 'Next Matchday')]
    Sleep              2s

Click Next Or Finish
    [Arguments]    ${index}    ${matchday_count}
    ${next_exists}=    Run Keyword And Return Status
    ...    Wait For Elements State    xpath=//button[contains(., 'Next Matchday')]    visible    timeout=3s
    ${finish_exists}=    Run Keyword And Return Status
    ...    Wait For Elements State    xpath=//button[contains(., 'Finish')]    visible    timeout=3s
    IF    ${next_exists}
        Log To Console    Clicking Next Matchday (${index}/${matchday_count})
        Click    xpath=//button[contains(., 'Next Matchday')]
        Wait Until Keyword Succeeds    5x    2s
        ...    Wait For Elements State    css=.MuiTextField-root input    detached    timeout=2s
        Wait Until Keyword Succeeds    5x    2s
        ...    Wait For Elements State    css=.MuiTextField-root input >> nth=0    visible    timeout=2s
        Sleep    1s
        RETURN    False
    ELSE IF    ${finish_exists}
        Log To Console    Clicking Finish (Final Page)
        Click    xpath=//button[contains(., 'Finish')]
        Wait For Load State    networkidle
        Sleep    3s
        RETURN    True
    ELSE
        Fail    No Next or Finish button found on matchday ${index}
    END

Prediction Flow
    [Documentation]    Complete prediction flow with random scores
    ${matchday_count}=    Get Matchday Count
    FOR    ${index}    IN RANGE    1    ${matchday_count + 1}
        Log    Processing Matchday ${index}/${matchday_count}
        Fill Predictions With Random Scores
        ${is_finished}=    Click Next Or Finish    ${index}    ${matchday_count}
        IF    ${is_finished}
            Log To Console    Finish button clicked — exiting loop.
            Exit For Loop
        END
        Sleep    2s
        Wait For Elements State    css=.MuiTextField-root input >> nth=0    visible
    END    

Verify Final Table
    [Documentation]    Verify that the Final League Table is displayed correctly
    Wait Until Keyword Succeeds    10x    2s
    ...    Wait For Elements State    xpath=//h5[normalize-space(.)='Final League Table']    visible    timeout=3s
    Wait For Elements State    xpath=//table[contains(@class, 'MuiTable-root')]    visible    timeout=10s
    ${rows}=    Get Elements    xpath=//h5[normalize-space(.)='Final League Table']/following::table[contains(@class, 'MuiTable-root')][1]//tbody/tr
    ${row_count}=    Get Length    ${rows}
    Should Be True    ${row_count} > 0
    Log To Console    Final League Table displayed with ${row_count} teams

Select UEL League
    Wait For Elements State    css=select.MuiBox-root    visible    timeout=10s
    Click    css=.MuiCard-root select
    Select Options By    css=select.MuiBox-root    value    UEL    
    Sleep    1s

Select UCL League
    Wait For Elements State    css=select.MuiBox-root    visible    timeout=10s
    Click    css=.MuiCard-root select
    Select Options By    css=select.MuiBox-root    value    UCL    
    Sleep    1s    

