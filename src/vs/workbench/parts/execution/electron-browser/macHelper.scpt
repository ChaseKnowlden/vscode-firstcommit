<<<<<<< HEAD
on run argv
 	set prevDelimiter to AppleScript's text item delimiters
	 
 	set AppleScript's text item delimiters to " "
 	set command to argv as string
 	set AppleScript's text item delimiters to prevDelimiter
	 		
	tell application "Terminal"
		activate
		
		set targetWindow to null
		
		repeat with currentWindow in windows
			if currentWindow is not busy then
				set targetWindow to currentWindow
			end if
		end repeat
		
		if targetWindow ≠ null then
			do script command in targetWindow
		else
			do script command
		end if
		
	end tell
end run
=======
on run argv
 	set prevDelimiter to AppleScript's text item delimiters
	 
 	set AppleScript's text item delimiters to " "
 	set command to argv as string
 	set AppleScript's text item delimiters to prevDelimiter
	 		
	tell application "Terminal"
		activate
		
		set targetWindow to null
		
		repeat with currentWindow in windows
			if currentWindow is not busy then
				set targetWindow to currentWindow
			end if
		end repeat
		
		if targetWindow ≠ null then
			do script command in targetWindow
		else
			do script command
		end if
		
	end tell
end run
>>>>>>> f315b8ece10915ec3be05e23f63bedcd7561a67d
