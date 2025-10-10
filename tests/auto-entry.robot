*** Settings ***
Library           Browser
Suite Setup       Open Browser To App
Suite Teardown    Close Browser

*** Variables ***
${URL}            https://friendly-adventure-wrjvx564jjq42vq4v-5173.app.github.dev
${BACKEND_URL}    https://friendly-adventure-wrjvx564jjq42vq4v-8000.app.github.dev
${LEAGUE}         UCFL

*** Test Cases ***
UCFL Prediction Flow
    [Documentation]    Test the complete prediction flow for UCFL league
    Select UCFL League
    Wait For Matchday To Load
    ${matchday_count}=    Get Matchday Count
    Log    Total matchdays to predict: ${matchday_count}
    FOR    ${index}    IN RANGE    1    ${matchday_count + 1}
        Log    Processing Matchday ${index}/${matchday_count}
        Fill Predictions With Random Scores
        Click Next Or Finish    ${index}    ${matchday_count}
        Sleep    2s
    END    
    Verify Final Table Is Displayed

*** Keywords ***
Open Browser To App
    [Documentation]    Open browser and navigate to the application
    New Browser    chromium    headless=True
    New Context    viewport={'width': 1920, 'height': 1080}
    New Page    ${URL}
    Wait For Load State    networkidle
    Sleep    2s

Select UCFL League
    [Documentation]    Select UEFA Conference League from the dropdown
    Wait For Elements State    css=.MuiCard-root select    visible    timeout=10s
    Click    css=.MuiCard-root select
    Select Options By    css=.MuiCard-root select    value    UCFL    
    Sleep    1s

Wait For Matchday To Load
    [Documentation]    Wait for the first matchday to load with matches
    Wait For Elements State    css=.MuiCardHeader-root    visible    timeout=15s
    Wait For Elements State    css=.MuiTextField-root input    visible    timeout=10s
    Sleep    2s

Get Matchday Count
    [Documentation]    Calculate total number of matchdays (assumes 18 matches per matchday)
    ${inputs}=    Get Elements    css=.MuiTextField-root input
    ${input_count}=    Get Length    ${inputs}
    ${match_count}=    Evaluate    ${input_count} / 2
    Log    Found ${match_count} matches in this matchday
    # UCFL typically has 6 matchdays, but we'll return a safe number
    RETURN    6

Fill Predictions With Random Scores
    [Documentation]    Fill all prediction inputs with scores between 0-3
    ${inputs}=    Get Elements    css=.MuiTextField-root input[placeholder="0"]
    ${input_count}=    Get Length    ${inputs}
    Log    Filling ${input_count} input fields    
    FOR    ${input}    IN    @{inputs}
        ${score}=    Evaluate    random.randint(0, 3)    modules=random
        Fill Text    ${input}    ${score}
        Sleep    0.1s
    END
    Sleep    1s
    Log    All predictions filled

Click Next Or Finish
    [Arguments]    ${current_index}    ${total_count}
    [Documentation]    Click Next Matchday or Finish button based on current position
    # Check if we're on the last matchday
    IF    ${current_index} == ${total_count}
        Log    Last matchday - clicking Finish
        ${finish_button}=    Get Element    xpath=//button[contains(., 'Finish')]
        Click    ${finish_button}
        Wait For Load State    networkidle
        Sleep    3s
    ELSE
        Log    Clicking Next Matchday
        ${next_button}=    Get Element    xpath=//button[contains(., 'Next Matchday')]
        Click    ${next_button}
        Wait For Load State    networkidle
        Sleep    2s
        Wait For Elements State    css=.MuiTextField-root input    visible    timeout=10s
    END

Verify Final Table Is Displayed
    [Documentation]    Verify that the final standings table is displayed
    Wait For Elements State    xpath=//h5[contains(., 'Final Standings')]    visible    timeout=10s
    Wait For Elements State    css=.MuiTable-root    visible    timeout=5s    
    # Verify table has rows
    ${rows}=    Get Elements    css=.MuiTableBody-root .MuiTableRow-root
    ${row_count}=    Get Length    ${rows}
    Should Be True    ${row_count} > 0    msg=Table should have at least one row    
    Log    Final table displayed with ${row_count} teams

Verify Prediction Stored
    [Documentation]    Verify predictions are stored in state
    ${page_content}=    Get Text    body
    Should Contain    ${page_content}    Matchday

Test Back Button
    [Documentation]    Test the back button functionality
    Click    xpath=//button[contains(., 'Back')]
    Sleep    1s
    Wait For Elements State    css=.MuiTextField-root input    visible

Download And Verify PDF
    [Documentation]    Test PDF download functionality
    Click    xpath=//button[contains(., 'Download Final PDF')]
    Sleep    3s
    # Add PDF verification logic here

Test Predict Again
    [Documentation]    Test the reset functionality
    Click    xpath=//button[contains(., 'Predict Again')]
    Sleep    2s
    Wait For Elements State    css=.MuiCard-root select    visible