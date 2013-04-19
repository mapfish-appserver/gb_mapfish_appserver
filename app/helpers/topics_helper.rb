module TopicsHelper

def leg_tab_row(text, image)
  html = "<tr>"
  html << "<td class='legtabsymbol'>"
  html << "<img src='" + image_path(image) + "'></td>"
  html << "<td class='legtabtext'><div class='t3'>#{text}</div></td>"
  html << "</tr>"
  html.html_safe
end

end
