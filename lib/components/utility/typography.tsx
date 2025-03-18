import styled from "styled-components";

export const DefaultStylesProvider = styled.div`
	* {
		box-sizing: border-box;
  		font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
		scrollbar-width: thin;
		scrollbar-color: #888 #f1f1f1;

		::-webkit-scrollbar {
			width: 8px;
		}
		::-webkit-scrollbar-track {
			background: #f1f1f1;
		}

		::-webkit-scrollbar-thumb {
			background: #888;
			border-radius: 4px;
		}

		::-webkit-scrollbar-thumb:hover {
			background: #555;
		}
	}
`;
