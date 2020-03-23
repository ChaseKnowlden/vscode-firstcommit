<<<<<<< HEAD
on run argv
	set command to "cd \"" & argv & "\"; clear" as string
	
	tell application "iTerm"
		activate
		set myterm to (current terminal)
		tell myterm
			tell (launch session "Default")
				write text command
			end tell
		end tell
		
		set done to true
	end tell
end run
=======
on run argv
	set command to "cd \"" & argv & "\"; clear" as string
	
	tell application "iTerm"
		activate
		set myterm to (current terminal)
		tell myterm
			tell (launch session "Default")
				write text command
			end tell
		end tell
		
		set done to true
	end tell
end run
>>>>>>> f315b8ece10915ec3be05e23f63bedcd7561a67d
